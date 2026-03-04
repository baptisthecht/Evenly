"use server";

import { db } from "@evoly/db";
import { z } from "zod";
import { resend } from "@/lib/resend";
import { OrderConfirmationEmail } from "@evoly/email";
import { render } from "@react-email/render";
import crypto from "crypto";

// ─────────────────────────────────────────
// VALIDATE PROMO CODE
// ─────────────────────────────────────────

export async function validatePromoCodeAction(eventId: string, code: string) {
  const promo = await db.promoCode.findUnique({
    where: { eventId_code: { eventId, code: code.toUpperCase() } },
  });

  if (!promo || !promo.isActive) return { error: "Code invalide ou inactif." };
  if (promo.expiresAt && promo.expiresAt < new Date()) return { error: "Ce code a expiré." };
  if (promo.maxUses && promo.usedCount >= promo.maxUses) return { error: "Ce code a atteint sa limite d'utilisations." };

  return {
    success: true,
    promo: {
      id: promo.id,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      ticketTypeIds: promo.ticketTypeIds,
    },
  };
}

// ─────────────────────────────────────────
// CREATE FREE ORDER (no Stripe needed)
// ─────────────────────────────────────────

const checkoutSchema = z.object({
  eventId: z.string(),
  buyerEmail: z.string().email(),
  buyerFirstName: z.string().min(1),
  buyerLastName: z.string().min(1),
  buyerPhone: z.string().optional().nullable(),
  promoCodeId: z.string().optional().nullable(),
  items: z.array(z.object({
    ticketTypeId: z.string(),
    quantity: z.coerce.number().int().min(1),
    holderData: z.array(z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
    })).optional(),
  })),
});

export async function createFreeOrderAction(data: unknown) {
  const parsed = checkoutSchema.safeParse(data);
  if (!parsed.success) return { error: "Données invalides." };

  const { eventId, buyerEmail, buyerFirstName, buyerLastName, buyerPhone, promoCodeId, items } = parsed.data;

  // Load event + ticket types
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { ticketTypes: true, organization: { select: { planId: true, ticketsSoldThisMonth: true } } },
  });
  if (!event || event.status !== "PUBLISHED") return { error: "Événement introuvable ou non publié." };

  // Validate all items are free
  for (const item of items) {
    const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId);
    if (!tt) return { error: "Type de ticket introuvable." };
    if (tt.priceCents > 0 && !promoCodeId) return { error: "Ce ticket nécessite un paiement." };
    if (tt.quantity !== null && tt.quantitySold + item.quantity > tt.quantity) {
      return { error: `Plus assez de places disponibles pour "${tt.name}".` };
    }
  }

  // Create order + tickets in transaction
  const order = await db.$transaction(async (tx) => {
    const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);

    const newOrder = await tx.order.create({
      data: {
        eventId,
        buyerEmail,
        buyerFirstName,
        buyerLastName,
        buyerPhone: buyerPhone || null,
        subtotalCents: 0,
        discountCents: 0,
        feesCents: 0,
        totalCents: 0,
        promoCodeId: promoCodeId || null,
        status: "COMPLETED",
        items: {
          create: items.map((item) => ({
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            unitPriceCents: 0,
          })),
        },
      },
    });

    // Create tickets
    for (const item of items) {
      const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId)!;
      for (let i = 0; i < item.quantity; i++) {
        const holder = item.holderData?.[i];
        await tx.ticket.create({
          data: {
            orderId: newOrder.id,
            orderItemId: newOrder.id, // simplified
            qrCode: crypto.randomUUID(),
            holderFirstName: holder?.firstName || buyerFirstName,
            holderLastName: holder?.lastName || buyerLastName,
            holderEmail: holder?.email || buyerEmail,
            status: "ACTIVE",
          },
        });
      }

      // Decrement stock
      await tx.ticketType.update({
        where: { id: item.ticketTypeId },
        data: { quantitySold: { increment: item.quantity } },
      });
    }

    return newOrder;
  });

  return { success: true, orderId: order.id, magicToken: order.magicToken };
}

async function sendOrderConfirmationEmail(
  orderId: string,
  buyerEmail: string,
  buyerName: string,
  eventTitle: string,
  eventStartsAt: Date,
  locationName: string | null,
  ticketCount: number,
  totalCents: number,
  magicToken: string,
  confirmationMessage: string | null
) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.evoly.com";
    const html = await render(OrderConfirmationEmail({
      buyerName,
      eventTitle,
      eventDate: eventStartsAt.toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
      eventLocation: locationName,
      ticketCount,
      totalCents,
      magicToken,
      appUrl,
      confirmationMessage,
    }));
    await resend.emails.send({
      from: "Evoly <noreply@evoly.com>",
      to: buyerEmail,
      subject: `🎟️ Vos billets pour ${eventTitle}`,
      html,
    });
  } catch (err) {
    console.error("[Confirmation email]", err);
  }
}

// ─────────────────────────────────────────
// CREATE PAYMENT INTENT (paid tickets)
// ─────────────────────────────────────────

export async function createPaymentIntentAction(data: unknown) {
  const parsed = checkoutSchema.safeParse(data);
  if (!parsed.success) return { error: "Données invalides." };

  const { eventId, buyerEmail, buyerFirstName, buyerLastName, buyerPhone, promoCodeId, items } = parsed.data;

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      ticketTypes: true,
      organization: {
        select: {
          stripeAccountId: true,
          stripeAccountStatus: true,
          planId: true,
          ticketsSoldThisMonth: true,
        },
      },
    },
  });

  if (!event || event.status !== "PUBLISHED") return { error: "Événement introuvable." };
  if (!event.organization.stripeAccountId || event.organization.stripeAccountStatus !== "ACTIVE") {
    return { error: "Paiement non disponible pour cet événement." };
  }

  // Calculate totals
  let subtotal = 0;
  let discount = 0;

  let promo = null;
  if (promoCodeId) {
    promo = await db.promoCode.findUnique({ where: { id: promoCodeId } });
  }

  for (const item of items) {
    const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId);
    if (!tt) return { error: "Type de ticket introuvable." };
    if (tt.quantity !== null && tt.quantitySold + item.quantity > tt.quantity) {
      return { error: `Plus assez de places pour "${tt.name}".` };
    }

    let unitPrice = tt.priceCents;
    if (promo && (promo.ticketTypeIds.length === 0 || promo.ticketTypeIds.includes(tt.id))) {
      if (promo.type === "PERCENTAGE") {
        unitPrice = Math.round(unitPrice * (1 - promo.value / 100));
      } else if (promo.type === "FIXED") {
        unitPrice = Math.max(0, unitPrice - promo.value);
      }
    }

    subtotal += tt.priceCents * item.quantity;
    discount += (tt.priceCents - unitPrice) * item.quantity;
  }

  const discountedTotal = subtotal - discount;

  // Commission calculation
  const plan = await db.plan.findUnique({ where: { id: event.organization.planId } });
  const quota = plan?.monthlyFreeQuota ?? 30;
  const commissionRate = plan?.commissionRate ?? 0.05;
  const ticketsSold = event.organization.ticketsSoldThisMonth;
  const totalQty = items.reduce((a, i) => a + i.quantity, 0);
  const freeRemaining = Math.max(0, quota - ticketsSold);
  const paidQty = Math.max(0, totalQty - freeRemaining);
  const avgPrice = totalQty > 0 ? discountedTotal / totalQty : 0;
  const fees = Math.round(paidQty * avgPrice * commissionRate);

  const total = discountedTotal;

  // Create pending order
  const order = await db.order.create({
    data: {
      eventId,
      buyerEmail,
      buyerFirstName,
      buyerLastName,
      buyerPhone: buyerPhone || null,
      subtotalCents: subtotal,
      discountCents: discount,
      feesCents: fees,
      totalCents: total,
      promoCodeId: promoCodeId || null,
      status: "PENDING",
      items: {
        create: items.map((item) => {
          const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId)!;
          return {
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            unitPriceCents: tt.priceCents,
          };
        }),
      },
    },
  });

  // Create Stripe PaymentIntent
  // NOTE: Stripe integration complète en Phase 5
  // Pour l'instant on retourne les infos nécessaires au client
  return {
    success: true,
    orderId: order.id,
    totalCents: total,
    feesCents: fees,
    // stripeClientSecret: paymentIntent.client_secret  ← Phase 5
  };
}
