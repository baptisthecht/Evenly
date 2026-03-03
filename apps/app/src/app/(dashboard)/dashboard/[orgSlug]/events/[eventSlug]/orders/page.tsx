import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@evenly/db";

export default async function EventOrdersPage({
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
  });
  if (!event) redirect(`/dashboard/${orgSlug}/events`);

  const orders = await db.order.findMany({
    where: { eventId: event.id },
    include: {
      tickets: { include: { order: false } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const statusLabels: Record<string, { label: string; classes: string }> = {
    PENDING:             { label: "En attente",  classes: "bg-yellow-100 text-yellow-700" },
    COMPLETED:           { label: "Complété",    classes: "bg-green-100 text-green-700" },
    CANCELLED:           { label: "Annulé",      classes: "bg-gray-100 text-gray-500" },
    REFUNDED:            { label: "Remboursé",   classes: "bg-red-100 text-red-600" },
    PARTIALLY_REFUNDED:  { label: "Part. remb.", classes: "bg-orange-100 text-orange-600" },
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          Commandes ({orders.length})
        </h2>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-sm text-gray-400">
          Aucune commande pour l&apos;instant.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Acheteur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Billets</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const s = statusLabels[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{order.buyerFirstName} {order.buyerLastName}</p>
                        <p className="text-xs text-gray-400">{order.buyerEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {order.tickets.length} billet{order.tickets.length > 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {(order.totalCents / 100).toFixed(2)}€
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.classes}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {orders.map((order) => {
              const s = statusLabels[order.status];
              return (
                <div key={order.id} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {order.buyerFirstName} {order.buyerLastName}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.classes}`}>{s.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{order.buyerEmail}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{order.tickets.length} billet{order.tickets.length > 1 ? "s" : ""}</span>
                    <span>·</span>
                    <span className="font-semibold text-gray-900">{(order.totalCents / 100).toFixed(2)}€</span>
                    <span>·</span>
                    <span>{new Date(order.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
