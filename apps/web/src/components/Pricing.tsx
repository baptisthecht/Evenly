"use client";

import { useState } from "react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.evenly.com";

export function Pricing() {
  const [yearly, setYearly] = useState(false);

  const proPrice = yearly ? 20.75 : 29;
  const proTotal = yearly ? 249 : null;

  return (
    <section className="py-16 px-4" id="pricing">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)] mb-2">Tarifs</h2>
          <p className="text-[var(--muted)] text-sm mb-6">Sans frais cachés. Vraiment.</p>

          {/* Toggle */}
          <div className="inline-flex bg-black/5 rounded-full p-1 gap-1">
            {[false, true].map((y) => (
              <button
                key={String(y)}
                type="button"
                onClick={() => setYearly(y)}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  yearly === y ? "bg-white shadow text-[var(--ink)]" : "text-[var(--muted)]"
                }`}
              >
                {y ? (
                  <span className="flex items-center gap-1.5">
                    Annuel
                    <span className="text-[10px] bg-[var(--green)] text-white px-1.5 py-0.5 rounded-full font-bold">−15%</span>
                  </span>
                ) : "Mensuel"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Free */}
          <div className="bg-white rounded-2xl border border-black/8 p-7 space-y-5">
            <div>
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1">Free</p>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-4xl text-[var(--ink)]">0€</span>
                <span className="text-[var(--muted)] text-sm">/mois</span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-1">Sans carte bancaire</p>
            </div>

            <ul className="space-y-2.5 text-sm">
              {[
                "0% tickets gratuits (∞)",
                "30 tickets payants offerts/mois",
                "5% au-delà du quota",
                "Sous-domaine Evenly inclus",
                "QR Check-in inclus",
                "Emails transactionnels",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-[var(--ink)]">
                  <span className="text-[var(--muted)] mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={`${APP_URL}/register`}
              className="block text-center text-sm font-medium border border-black/15 rounded-full py-2.5 hover:bg-black/5 transition-colors"
            >
              Commencer gratuitement
            </a>
          </div>

          {/* Pro */}
          <div className="bg-[var(--ink)] rounded-2xl p-7 space-y-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-[10px] font-bold bg-[var(--violet)] text-white px-2.5 py-1 rounded-full">
              Populaire
            </div>
            {/* Decoration */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-[var(--violet)]/20" />

            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1">Pro</p>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-4xl text-white">{proPrice}€</span>
                <span className="text-white/50 text-sm">/mois</span>
              </div>
              {yearly && (
                <p className="text-xs text-white/40 mt-0.5">Facturé {proTotal}€/an</p>
              )}
              <p className="text-xs text-white/40 mt-0.5">Essai 14 jours — CB requise</p>
            </div>

            <ul className="space-y-2.5 text-sm">
              {[
                "Tout du plan Free",
                "150 tickets payants offerts/mois",
                "2.5% au-delà du quota",
                "Email marketing + automatisations",
                "Domaines custom + SSL",
                "Personnalisation couleurs & logo",
                "Sous-domaines événements dédiés",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-white/80">
                  <span className="text-[var(--violet)] mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={`${APP_URL}/register?plan=pro`}
              className="block text-center text-sm font-semibold bg-[var(--violet)] text-white rounded-full py-2.5 hover:bg-violet-600 transition-colors relative z-10"
            >
              Essayer 14 jours gratuit →
            </a>
          </div>
        </div>

        {/* Transparency note */}
        <p className="text-center text-xs text-[var(--muted)] mt-6 max-w-sm mx-auto leading-relaxed">
          Evenly affiche toujours sa commission à l&apos;organisateur <em>et</em> à l&apos;acheteur avant paiement. Aucune surprise.
        </p>
      </div>
    </section>
  );
}
