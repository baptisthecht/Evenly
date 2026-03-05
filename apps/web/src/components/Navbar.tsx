"use client";

import { useState } from "react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.evoly.me";

export function Navbar() {
	const [open, setOpen] = useState(false);

	return (
		<header className="fixed top-0 left-0 right-0 z-50 bg-[var(--sand)]/90 backdrop-blur-md border-b border-black/5">
			<nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
				{/* Logo */}
				<a
					href="#"
					className="font-display text-xl text-[var(--ink)] tracking-tight"
				>
					evoly
				</a>

				{/* Desktop links */}
				<div className="hidden md:flex items-center gap-6 text-sm text-[var(--muted)]">
					<a
						href="#features"
						className="hover:text-[var(--ink)] transition-colors"
					>
						Fonctionnalités
					</a>
					<a
						href="#pricing"
						className="hover:text-[var(--ink)] transition-colors"
					>
						Tarifs
					</a>
					<a href="#faq" className="hover:text-[var(--ink)] transition-colors">
						FAQ
					</a>
				</div>

				{/* CTA */}
				<div className="hidden md:flex items-center gap-3">
					<a
						href={`${APP_URL}/login`}
						className="text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors px-3 py-1.5"
					>
						Connexion
					</a>
					<a
						href={`${APP_URL}/register`}
						className="text-sm font-medium bg-[var(--ink)] text-white px-4 py-2 rounded-full hover:bg-[var(--violet)] transition-colors"
					>
						Créer un compte
					</a>
				</div>

				{/* Mobile hamburger */}
				<button
					type="button"
					className="md:hidden p-2 text-[var(--ink)]"
					onClick={() => setOpen((v) => !v)}
					aria-label="Menu"
				>
					<div className="w-5 space-y-1">
						<span
							className={`block h-0.5 bg-current transition-all ${open ? "rotate-45 translate-y-1.5" : ""}`}
						/>
						<span
							className={`block h-0.5 bg-current transition-all ${open ? "opacity-0" : ""}`}
						/>
						<span
							className={`block h-0.5 bg-current transition-all ${open ? "-rotate-45 -translate-y-1.5" : ""}`}
						/>
					</div>
				</button>
			</nav>

			{/* Mobile menu */}
			{open && (
				<div className="md:hidden border-t border-black/5 bg-[var(--sand)] px-4 py-4 space-y-3">
					{["#features", "#pricing", "#faq"].map((href) => (
						<a
							key={href}
							href={href}
							onClick={() => setOpen(false)}
							className="block text-sm text-[var(--muted)] hover:text-[var(--ink)] py-1"
						>
							{href === "#features"
								? "Fonctionnalités"
								: href === "#pricing"
									? "Tarifs"
									: "FAQ"}
						</a>
					))}
					<div className="pt-2 flex flex-col gap-2">
						<a
							href={`${APP_URL}/login`}
							className="text-sm text-center border border-black/10 rounded-full py-2 hover:bg-black/5"
						>
							Connexion
						</a>
						<a
							href={`${APP_URL}/register`}
							className="text-sm text-center bg-[var(--ink)] text-white rounded-full py-2 hover:bg-[var(--violet)] transition-colors"
						>
							Créer un compte
						</a>
					</div>
				</div>
			)}
		</header>
	);
}
