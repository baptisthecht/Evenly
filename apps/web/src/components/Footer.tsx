const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.evoly.me";

const columns = [
	{
		title: "Evoly",
		links: [
			{ label: "Fonctionnalités", href: "#features" },
			{ label: "Tarifs", href: "#pricing" },
			{ label: "FAQ", href: "#faq" },
			{ label: "Changelog", href: "#" },
		],
	},
	{
		title: "Légal",
		links: [
			{ label: "CGU", href: "/cgu" },
			{ label: "Confidentialité", href: "/privacy" },
			{ label: "Mentions légales", href: "/legal" },
			{ label: "Cookies", href: "/cookies" },
		],
	},
	{
		title: "Support",
		links: [
			{ label: "Documentation", href: "#" },
			{ label: "Contact", href: "mailto:hello@evoly.me" },
			{ label: "Status", href: "#" },
		],
	},
];

const socials = [
	{ label: "Twitter/X", href: "https://twitter.com", icon: "𝕏" },
	{ label: "LinkedIn", href: "https://linkedin.com", icon: "in" },
	{ label: "Instagram", href: "https://instagram.com", icon: "◎" },
];

export function Footer() {
	return (
		<footer className="bg-[var(--ink)] text-white/60 py-12 px-4">
			<div className="max-w-5xl mx-auto">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
					{/* Brand col */}
					<div className="col-span-2 md:col-span-1 space-y-4">
						<span className="font-display text-xl text-white">evoly</span>
						<p className="text-xs leading-relaxed">La billetterie honnête.</p>
						<div className="flex gap-3">
							{socials.map((s) => (
								<a
									key={s.label}
									href={s.href}
									aria-label={s.label}
									className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-xs hover:border-white/30 hover:text-white transition-colors"
								>
									{s.icon}
								</a>
							))}
						</div>
					</div>

					{/* Links */}
					{columns.map((col) => (
						<div key={col.title} className="space-y-3">
							<p className="text-xs font-semibold text-white uppercase tracking-wider">
								{col.title}
							</p>
							<ul className="space-y-2">
								{col.links.map((link) => (
									<li key={link.label}>
										<a
											href={link.href}
											className="text-xs hover:text-white transition-colors"
										>
											{link.label}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				{/* Bottom */}
				<div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
					<p className="text-xs">© 2025 Evoly. Fait avec ♥ en Belgique.</p>
					<a
						href={`${APP_URL}/register`}
						className="text-xs font-semibold bg-[var(--violet)] text-white px-4 py-2 rounded-full hover:bg-violet-600 transition-colors"
					>
						Créer un compte gratuit →
					</a>
				</div>
			</div>
		</footer>
	);
}
