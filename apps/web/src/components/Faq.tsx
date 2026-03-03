"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Comment fonctionne la commission ?",
    a: "En Free : 0% sur les tickets gratuits, 30 tickets payants offerts par mois, puis 5% au-delà. En Pro : mêmes 0%, 150 tickets offerts, puis 2.5%. La commission est prélevée directement sur chaque paiement via Stripe — vous recevez votre argent net.",
  },
  {
    q: "Les tickets gratuits sont-ils vraiment sans commission ?",
    a: "Oui, sans exception. Aucun frais fixe, aucun don pré-coché, aucune surprise. Si votre événement est 100% gratuit, Evenly ne vous prend rien.",
  },
  {
    q: "Quand est-ce que je reçois mon argent ?",
    a: "20% de chaque paiement est retenu 30 jours en réserve (protection anti-fraude). Le reste est disponible immédiatement. Vous déclenchez les virements manuellement depuis votre dashboard. Délai : 1-2 jours ouvrés.",
  },
  {
    q: "Comment fonctionne l'essai Pro 14 jours ?",
    a: "Carte bancaire requise à l'inscription. Aucun prélèvement pendant 14 jours. À l'issue, vous êtes facturé automatiquement sauf si vous annulez avant.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui. Annulation depuis le dashboard, downgrade à la fin de la période en cours. Aucun remboursement prorata.",
  },
  {
    q: "Comment configurer mon domaine custom ?",
    a: "Dashboard → Domaines → Ajouter. Vous recevez les instructions CNAME pour votre registrar (OVH, Cloudflare, Namecheap, Gandi…). SSL automatique dès validation DNS.",
  },
  {
    q: "Evenly est-il conforme au RGPD ?",
    a: "Oui. Données hébergées en Union Européenne. Pas de revente de données, pas de publicité. Gestion des désinscriptions emails intégrée.",
  },
  {
    q: "Quelle différence avec HelloAsso ?",
    a: "HelloAsso est réservé aux associations françaises et repose sur un modèle de don volontaire pré-coché (~20% de vos acheteurs paient). Evenly est ouvert à tous, sans don pré-coché, avec des frais explicites.",
  },
  {
    q: "Comment fonctionne le check-in QR ?",
    a: "Depuis l'onglet Check-in d'un événement, générez des liens temporaires pour vos bénévoles. Ils ouvrent le lien sur leur téléphone (PWA installable), scannent les QR avec la caméra, et reçoivent un feedback immédiat. Aucun compte requis pour les bénévoles.",
  },
  {
    q: "Que se passe-t-il si j'annule un événement ?",
    a: "Tous les acheteurs sont remboursés automatiquement via Stripe. Evenly garde sa commission (standard industrie, comme Stripe ne rembourse pas ses frais). Un email est envoyé automatiquement à tous les acheteurs.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-16 px-4 bg-white border-t border-black/5" id="faq">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)] mb-2">Questions fréquentes</h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-black/8 rounded-xl overflow-hidden bg-[var(--sand)]">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                aria-expanded={open === i}
              >
                <span className="text-sm font-medium text-[var(--ink)] pr-4">{faq.q}</span>
                <span className={`flex-shrink-0 w-5 h-5 rounded-full border border-black/10 flex items-center justify-center text-[var(--muted)] transition-transform ${open === i ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-[var(--muted)] leading-relaxed border-t border-black/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
