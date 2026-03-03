import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@evenly/db";
import { resend } from "@/lib/resend";
import { OrderConfirmationEmail } from "@evenly/email";
import { render } from "@react-email/render";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Billetterie ──────────────────────────

      case "payment_intent.succeeded": {
        const pi = event.data.object as any;
        const order = await db.order.findFirst({
          where: { stripePaymentIntentId: pi.id },
          include: {
            items: { include: { ticketType: true } },
            event: { include: { organization: true } },
          },
        });
        if (!order || order.status === "COMPLETED") break;

        await db.$transaction(async (tx) => {
          // Complete order
          await tx.order.update({
            where: { id: order.id },
            data: { status: "COMPLETED" },
          });

          // Create tickets
          for (const item of order.items) {
            for (let i = 0; i < item.quantity; i++) {
              await tx.ticket.create({
                data: {
                  orderId: order.id,
                  orderItemId: item.id,
                  qrCode: crypto.randomUUID(),
                  holderFirstName: order.buyerFirstName,
                  holderLastName: order.buyerLastName,
                  holderEmail: order.buyerEmail,
                  status: "ACTIVE",
                },
              });
            }

            // Decrement stock permanently
            await tx.ticketType.update({
              where: { id: item.ticketTypeId },
              data: { quantitySold: { increment: item.quantity } },
            });
          }

          // Increment quota
          const totalQty = order.items.reduce((a, i) => a + i.quantity, 0);
          await tx.organization.update({
            where: { id: order.event.organizationId },
            data: { ticketsSoldThisMonth: { increment: totalQty } },
          });

          // Create reserve (20% / 30 jours)
          const reserveAmount = Math.round(order.totalCents * 0.2);
          const availableAmount = order.totalCents - order.feesCents - reserveAmount;

          await tx.reserve.create({
            data: {
              organizationId: order.event.organizationId,
              orderId: order.id,
              amountCents: reserveAmount,
              releasesAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });

          // Send confirmation email
          try {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.evenly.com";
            const html = await render(OrderConfirmationEmail({
              buyerName: `${order.buyerFirstName} ${order.buyerLastName}`,
              eventTitle: order.event.title,
              eventDate: new Date(order.event.startsAt).toLocaleDateString("fr-FR", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              }),
              eventLocation: order.event.locationName ?? null,
              ticketCount: order.items.reduce((a, i) => a + i.quantity, 0),
              totalCents: order.totalCents,
              magicToken: order.magicToken,
              appUrl,
              confirmationMessage: order.event.confirmationMessage ?? null,
            }));

            await resend.emails.send({
              from: "Evenly <noreply@evenly.com>",
              to: order.buyerEmail,
              subject: `🎟️ Vos billets pour ${order.event.title}`,
              html,
            });
          } catch (emailErr) {
            console.error("[Confirmation email error]", emailErr);
          }{
            where: { id: order.event.organizationId },
            data: { availableBalanceCents: { increment: Math.max(0, availableAmount) } },
          });
        });
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as any;
        await db.order.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { status: "CANCELLED" },
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as any;
        const order = await db.order.findFirst({
          where: { stripePaymentIntentId: charge.payment_intent },
        });
        if (order) {
          await db.refundRequest.updateMany({
            where: { orderId: order.id, status: "APPROVED" },
            data: { status: "PROCESSED" },
          });
        }
        break;
      }

      // ── Abonnements Pro ──────────────────────

      case "checkout.session.completed": {
        const session = event.data.object as any;
        const organizationId = session.metadata?.organizationId;
        if (!organizationId || session.mode !== "subscription") break;

        await db.organization.update({
          where: { id: organizationId },
          data: {
            planId: "pro",
            stripeSubscriptionId: session.subscription,
            subscriptionStatus: session.subscription ? "TRIALING" : "ACTIVE",
            trialEndsAt: session.subscription
              ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
              : null,
          },
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        if (!invoice.subscription) break;

        const org = await db.organization.findFirst({
          where: { stripeSubscriptionId: invoice.subscription },
        });
        if (!org) break;

        await db.organization.update({
          where: { id: org.id },
          data: {
            planId: "pro",
            subscriptionStatus: "ACTIVE",
            // Reset monthly quota on renewal
            ticketsSoldThisMonth: 0,
            quotaResetAt: new Date(),
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        if (!invoice.subscription) break;

        const org = await db.organization.findFirst({
          where: { stripeSubscriptionId: invoice.subscription },
        });
        if (!org) break;

        await db.organization.update({
          where: { id: org.id },
          data: { subscriptionStatus: "PAST_DUE" },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const org = await db.organization.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!org) break;

        await db.organization.update({
          where: { id: org.id },
          data: {
            planId: "free",
            subscriptionStatus: "CANCELED",
            stripeSubscriptionId: null,
            trialEndsAt: null,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const org = await db.organization.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!org) break;

        const statusMap: Record<string, string> = {
          active: "ACTIVE",
          trialing: "TRIALING",
          past_due: "PAST_DUE",
          canceled: "CANCELED",
          unpaid: "PAST_DUE",
        };

        await db.organization.update({
          where: { id: org.id },
          data: {
            subscriptionStatus: (statusMap[sub.status] ?? "INACTIVE") as any,
            subscriptionEndsAt: sub.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : null,
          },
        });
        break;
      }

      // ── Stripe Connect ────────────────────────

      case "account.updated": {
        const account = event.data.object as any;
        const org = await db.organization.findFirst({
          where: { stripeAccountId: account.id },
        });
        if (!org) break;

        let status: string = "PENDING";
        if (account.charges_enabled && account.payouts_enabled) {
          status = "ACTIVE";
        } else if (account.requirements?.disabled_reason) {
          status = "RESTRICTED";
        } else if (account.requirements?.errors?.length > 0) {
          status = "RESTRICTED";
        } else if (account.requirements?.eventually_due?.length > 0) {
          status = "RESTRICTED_SOON";
        }

        await db.organization.update({
          where: { id: org.id },
          data: { stripeAccountStatus: status as any },
        });
        break;
      }

      case "transfer.paid": {
        const transfer = event.data.object as any;
        await db.payout.updateMany({
          where: { stripePayoutId: transfer.id },
          data: { status: "PAID", paidAt: new Date() },
        });
        break;
      }

      case "transfer.failed": {
        const transfer = event.data.object as any;
        const payout = await db.payout.findFirst({
          where: { stripePayoutId: transfer.id },
        });
        if (payout) {
          await db.payout.update({
            where: { id: payout.id },
            data: { status: "FAILED", failureReason: transfer.failure_message ?? "Échec du virement" },
          });
          // Recréditer le solde
          await db.organization.update({
            where: { id: payout.organizationId },
            data: { availableBalanceCents: { increment: payout.amountCents } },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe Webhook Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
