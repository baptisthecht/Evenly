import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@evenly/db";
import { CopyButton } from "@/components/ui/CopyButton";

export default async function EventOverviewPage({
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
    include: {
      ticketTypes: { orderBy: { sortOrder: "asc" } },
      _count: { select: { orders: true } },
    },
  });
  if (!event) redirect(`/dashboard/${orgSlug}/events`);

  // KPIs
  const orders = await db.order.findMany({
    where: { eventId: event.id, status: "COMPLETED" },
    include: { tickets: true },
    orderBy: { createdAt: "desc" },
  });

  const revenue = orders.reduce((acc, o) => acc + (o.totalCents - o.feesCents), 0);
  const ticketsSold = orders.reduce((acc, o) => acc + o.tickets.length, 0);
  const totalCapacity = event.ticketTypes.reduce((acc, tt) => acc + (tt.quantity ?? 0), 0);
  const fillRate = totalCapacity > 0 ? Math.round((ticketsSold / totalCapacity) * 100) : null;

  const checkedIn = await db.ticket.count({
    where: { order: { eventId: event.id }, checkedIn: true },
  });
  const checkinRate = ticketsSold > 0 ? Math.round((checkedIn / ticketsSold) * 100) : 0;

  // Sales over time (group by day)
  const salesByDay: Record<string, number> = {};
  orders.forEach((o) => {
    const day = o.createdAt.toISOString().split("T")[0];
    salesByDay[day] = (salesByDay[day] ?? 0) + o.tickets.length;
  });

  const publicUrl = event.status === "PUBLISHED"
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/e/${event.slug}`
    : null;

  return (
    <div className="p-6 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Revenus nets" value={`${(revenue / 100).toFixed(2)}€`} />
        <KpiCard label="Tickets vendus" value={ticketsSold.toString()} />
        {fillRate !== null && <KpiCard label="Remplissage" value={`${fillRate}%`} />}
        <KpiCard label="Check-in" value={`${checkedIn} / ${ticketsSold}`} sub={`${checkinRate}%`} />
      </div>

      {/* Public link */}
      {publicUrl && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-violet-700 mb-0.5">Lien public</p>
            <p className="text-sm text-violet-800 font-mono truncate">{publicUrl}</p>
          </div>
          <div className="flex gap-2">
            <CopyButton text={publicUrl} />
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-medium text-violet-700 border border-violet-300 rounded-lg hover:bg-violet-100 transition-colors"
            >
              Voir
            </a>
          </div>
        </div>
      )}

      {/* Ticket types summary */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Tickets</h2>
          <a
            href={`/dashboard/${orgSlug}/events/${eventSlug}/tickets`}
            className="text-xs text-violet-600 hover:underline"
          >
            Gérer
          </a>
        </div>
        {event.ticketTypes.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400 mb-3">Aucun ticket configuré.</p>
            <a
              href={`/dashboard/${orgSlug}/events/${eventSlug}/tickets`}
              className="text-sm text-violet-600 font-medium hover:underline"
            >
              + Ajouter un ticket
            </a>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {event.ticketTypes.map((tt) => {
              const cap = tt.quantity;
              const sold = tt.quantitySold;
              const pct = cap ? Math.round((sold / cap) * 100) : null;
              return (
                <li key={tt.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      tt.status === "ACTIVE" ? "bg-green-400" : "bg-gray-300"
                    }`} />
                    <span className="text-sm font-medium text-gray-900 truncate">{tt.name}</span>
                    <span className="text-xs text-gray-400">
                      {tt.priceCents === 0 ? "Gratuit" : `${(tt.priceCents / 100).toFixed(2)}€`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm text-gray-600">
                      {sold}{cap ? ` / ${cap}` : ""}
                    </span>
                    {pct !== null && (
                      <div className="w-16 bg-gray-100 rounded-full h-1.5 hidden sm:block">
                        <div
                          className="bg-violet-500 h-1.5 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Commandes récentes</h2>
          <a href={`/dashboard/${orgSlug}/events/${eventSlug}/orders`} className="text-xs text-violet-600 hover:underline">
            Toutes
          </a>
        </div>
        {orders.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Aucune commande pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {orders.slice(0, 5).map((order) => (
              <li key={order.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {order.buyerFirstName} {order.buyerLastName}
                  </p>
                  <p className="text-xs text-gray-400">{order.buyerEmail}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    {order.tickets.length} billet{order.tickets.length > 1 ? "s" : ""}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {((order.totalCents) / 100).toFixed(2)}€
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
