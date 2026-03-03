import { db } from "@evenly/db";
import { notFound } from "next/navigation";

export default async function MagicTicketsPage({
	params,
}: {
	params: Promise<{ magicToken: string }>;
}) {
	const { magicToken } = await params;

	const order = await db.order.findUnique({
		where: { magicToken },
		include: {
			event: {
				select: {
					title: true,
					startsAt: true,
					endsAt: true,
					locationName: true,
					locationAddress: true,
					locationType: true,
					organization: { select: { name: true, logoUrl: true } },
				},
			},
			tickets: {
				include: {
					order: { select: { buyerFirstName: true, buyerLastName: true } },
				},
			},
			items: true,
		},
	});

	if (!order) notFound();

	const event = order.event;

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Navbar */}
			<nav className="bg-white border-b border-gray-200 px-4 py-3">
				<div className="max-w-xl mx-auto flex items-center justify-between">
					<span className="font-bold text-violet-600 text-lg">evenly</span>
					<span className="text-sm text-gray-500">
						{event.organization.name}
					</span>
				</div>
			</nav>

			<div className="max-w-xl mx-auto px-4 py-8 space-y-6">
				{/* Event info */}
				<div className="bg-white rounded-2xl border border-gray-200 p-5">
					<h1 className="text-lg font-bold text-gray-900">{event.title}</h1>
					<div className="mt-3 space-y-1.5 text-sm text-gray-500">
						<p>
							📅{" "}
							{new Date(event.startsAt).toLocaleDateString("fr-FR", {
								weekday: "long",
								day: "numeric",
								month: "long",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</p>
						{event.locationName && (
							<p>
								📍 {event.locationName}
								{event.locationAddress ? ` · ${event.locationAddress}` : ""}
							</p>
						)}
					</div>
				</div>

				{/* Order summary */}
				<div className="bg-white rounded-2xl border border-gray-200 p-5">
					<div className="flex items-center justify-between mb-3">
						<h2 className="text-sm font-semibold text-gray-900">
							Commande #{order.id.slice(-8).toUpperCase()}
						</h2>
						<span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
							{order.status === "COMPLETED" ? "Confirmée" : order.status}
						</span>
					</div>
					<p className="text-sm text-gray-600">
						{order.buyerFirstName} {order.buyerLastName} · {order.buyerEmail}
					</p>
					<p className="text-sm font-semibold text-gray-900 mt-1">
						Total :{" "}
						{order.totalCents === 0
							? "Gratuit"
							: `${(order.totalCents / 100).toFixed(2)}€`}
					</p>
				</div>

				{/* Tickets */}
				<div className="space-y-3">
					<h2 className="text-sm font-semibold text-gray-900 px-1">
						{order.tickets.length} billet{order.tickets.length > 1 ? "s" : ""}
					</h2>
					{order.tickets.map((ticket, i) => {
						const item = order.items.find(() => true); // simplified
						return (
							<div
								key={ticket.id}
								className="bg-white rounded-2xl border border-gray-200 p-5"
							>
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="text-xs font-medium text-violet-600 uppercase tracking-wide">
											Billet {i + 1}
										</p>
										<p className="text-base font-bold text-gray-900 mt-0.5">
											{ticket.holderFirstName ?? order.buyerFirstName}{" "}
											{ticket.holderLastName ?? order.buyerLastName}
										</p>
										{ticket.holderEmail && (
											<p className="text-xs text-gray-400 mt-0.5">
												{ticket.holderEmail}
											</p>
										)}
										<div className="mt-3 flex items-center gap-2">
											<span
												className={`text-xs px-2 py-0.5 rounded-full font-medium ${
													ticket.checkedIn
														? "bg-blue-100 text-blue-700"
														: "bg-green-100 text-green-700"
												}`}
											>
												{ticket.checkedIn ? "✓ Scanné" : "Valide"}
											</span>
										</div>
									</div>

									{/* QR Code placeholder */}
									<div className="flex-shrink-0">
										<QRDisplay value={ticket.qrCode} />
									</div>
								</div>

								<div className="mt-4 pt-3 border-t border-gray-100">
									<p className="text-xs text-gray-400 font-mono">
										{ticket.qrCode}
									</p>
								</div>
							</div>
						);
					})}
				</div>

				<p className="text-center text-xs text-gray-400 pb-4">
					Gardez cette page accessible pour le check-in · evenly.com
				</p>
			</div>
		</div>
	);
}

// Simple SVG QR code placeholder — Phase 5 will use real QR generation
function QRDisplay({ value }: { value: string }) {
	return (
		<div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
			<svg
				className="w-12 h-12 text-gray-800"
				viewBox="0 0 100 100"
				fill="currentColor"
			>
				{/* Simple QR-like pattern */}
				<rect x="10" y="10" width="30" height="30" rx="3" />
				<rect x="60" y="10" width="30" height="30" rx="3" />
				<rect x="10" y="60" width="30" height="30" rx="3" />
				<rect x="15" y="15" width="20" height="20" rx="1" fill="white" />
				<rect x="65" y="15" width="20" height="20" rx="1" fill="white" />
				<rect x="15" y="65" width="20" height="20" rx="1" fill="white" />
				<rect x="20" y="20" width="10" height="10" />
				<rect x="70" y="20" width="10" height="10" />
				<rect x="20" y="70" width="10" height="10" />
				{/* Center dots */}
				<rect x="60" y="60" width="8" height="8" />
				<rect x="72" y="60" width="8" height="8" />
				<rect x="84" y="60" width="8" height="8" />
				<rect x="60" y="72" width="8" height="8" />
				<rect x="84" y="72" width="8" height="8" />
				<rect x="60" y="84" width="8" height="8" />
				<rect x="72" y="84" width="8" height="8" />
				<rect x="84" y="84" width="8" height="8" />
			</svg>
		</div>
	);
}
