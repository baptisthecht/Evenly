import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@evenly/db";
import { ScannerLinksManager } from "@/components/events/ScannerLinksManager";

export default async function EventCheckinPage({
  params,
}: {
  params: Promise<{ orgSlug: string; eventSlug: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { orgSlug, eventSlug } = await params;

  const org = await db.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) redirect("/dashboard");

  const event = await db.event.findUnique({
    where: { organizationId_slug: { organizationId: org.id, slug: eventSlug } },
    include: { scannerLinks: { orderBy: { expiresAt: "desc" } } },
  });
  if (!event) redirect(`/dashboard/${orgSlug}/events`);

  // Check-in stats
  const [totalTickets, checkedIn] = await Promise.all([
    db.ticket.count({ where: { order: { eventId: event.id }, status: "ACTIVE" } }),
    db.ticket.count({ where: { order: { eventId: event.id }, checkedIn: true } }),
  ]);

  const recentCheckins = await db.ticket.findMany({
    where: { order: { eventId: event.id }, checkedIn: true },
    orderBy: { checkedInAt: "desc" },
    take: 20,
    include: { order: { select: { buyerFirstName: true, buyerLastName: true } } },
  });

  const membership = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: org.id, userId: session.user.id } },
    include: { role: true },
  });

  const canManage = membership?.role.permissions.includes("EVENTS_EDIT") ?? false;

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{checkedIn}</p>
          <p className="text-xs text-gray-400 mt-1">Présents</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
          <p className="text-xs text-gray-400 mt-1">Total</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-violet-600">
            {totalTickets > 0 ? Math.round((checkedIn / totalTickets) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-400 mt-1">Taux</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-violet-500 h-3 rounded-full transition-all"
            style={{ width: totalTickets > 0 ? `${(checkedIn / totalTickets) * 100}%` : "0%" }}
            role="progressbar"
            aria-valuenow={checkedIn}
            aria-valuemin={0}
            aria-valuemax={totalTickets}
          />
        </div>
      </div>

      {/* Scanner link to app */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-violet-900">Scanner QR</p>
          <p className="text-xs text-violet-600">Ouvrez l&apos;app scanner sur votre téléphone</p>
        </div>
        <a
          href={`${process.env.NEXT_PUBLIC_SCANNER_URL ?? "http://localhost:3002"}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          Ouvrir →
        </a>
      </div>

      {/* Scanner links for volunteers */}
      <ScannerLinksManager
        eventId={event.id}
        organizationId={org.id}
        scannerLinks={event.scannerLinks}
        canManage={canManage}
      />

      {/* Recent check-ins */}
      {recentCheckins.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Derniers check-ins</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {recentCheckins.map((ticket) => (
              <li key={ticket.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <p className="text-sm text-gray-900">
                  {ticket.holderFirstName ?? ticket.order.buyerFirstName}{" "}
                  {ticket.holderLastName ?? ticket.order.buyerLastName}
                </p>
                <p className="text-xs text-gray-400">
                  {ticket.checkedInAt
                    ? new Date(ticket.checkedInAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
