"use client";

import { useEffect, useRef } from "react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.evoly.me";

export function Hero() {
	const counterRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		// Animate savings counter
		const target = 148320;
		let start = 0;
		const duration = 1800;
		const startTime = performance.now();
		const tick = (now: number) => {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			start = Math.round(eased * target);
			if (counterRef.current) {
				counterRef.current.textContent = start.toLocaleString("fr-FR") + "€";
			}
			if (progress < 1) requestAnimationFrame(tick);
		};
		const raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, []);

	return (
		<section className="pt-28 pb-16 px-4 overflow-hidden">
			<div className="max-w-5xl mx-auto">
				{/* Badge */}
				<div className="animate-fade-up flex justify-center mb-8">
					<span className="inline-flex items-center gap-2 text-xs font-medium bg-[var(--violet-subtle)] text-[var(--violet)] border border-[var(--violet)]/20 px-3 py-1.5 rounded-full">
						<span className="w-1.5 h-1.5 rounded-full bg-[var(--violet)] animate-pulse" />
						Alternative à Eventbrite — Fenêtre ouverte en 2026
					</span>
				</div>

				{/* Headline */}
				<div className="text-center space-y-4 mb-10">
					<h1 className="animate-fade-up delay-100 font-display text-5xl sm:text-6xl md:text-7xl text-[var(--ink)] leading-[1.05] tracking-tight">
						La billetterie{" "}
						<em className="not-italic text-[var(--violet)]">honnête.</em>
					</h1>
					<p className="animate-fade-up delay-200 text-lg sm:text-xl text-[var(--muted)] max-w-xl mx-auto leading-relaxed">
						Créez votre événement en 60 secondes.{" "}
						<strong className="text-[var(--ink)] font-medium">
							0% sur les tickets gratuits.
						</strong>{" "}
						Frais affichés clairement, toujours.
					</p>
				</div>

				{/* CTAs */}
				<div className="animate-fade-up delay-300 flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
					<a
						href={`${APP_URL}/register`}
						className="w-full sm:w-auto text-center text-sm font-semibold bg-[var(--ink)] text-white px-7 py-3.5 rounded-full hover:bg-[var(--violet)] transition-all hover:scale-[1.02] active:scale-[0.98]"
					>
						Créer mon premier événement →
					</a>
					<a
						href="#features"
						className="w-full sm:w-auto text-center text-sm text-[var(--muted)] border border-black/10 px-7 py-3.5 rounded-full hover:bg-black/5 transition-colors"
					>
						Comment ça marche
					</a>
				</div>

				{/* Trust badges */}
				<div className="animate-fade-up delay-400 flex flex-wrap justify-center gap-4 mb-14">
					{[
						{ icon: "🔒", label: "Paiement Stripe" },
						{ icon: "🇪🇺", label: "Données en EU" },
						{ icon: "✅", label: "RGPD conforme" },
						{ icon: "0€", label: "Gratuit sans engagement" },
					].map(({ icon, label }) => (
						<span
							key={label}
							className="flex items-center gap-1.5 text-xs text-[var(--muted)]"
						>
							<span>{icon}</span>
							{label}
						</span>
					))}
				</div>

				{/* Savings counter */}
				<div className="animate-fade-up delay-400 flex justify-center">
					<div className="relative bg-white border border-black/8 rounded-2xl px-6 py-4 shadow-sm text-center max-w-xs w-full">
						<p className="text-xs text-[var(--muted)] mb-1">
							Économisé vs Eventbrite ce mois
						</p>
						<p className="font-display text-3xl text-[var(--violet)]">
							<span ref={counterRef}>0€</span>
						</p>
						<div className="absolute -top-2 -right-2 bg-[var(--green)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
							−78%
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
