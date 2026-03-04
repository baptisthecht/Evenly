const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.evoly.com";

const features = [
  {
    tag: "Création",
    title: "Votre événement en 60 secondes",
    body: "Wizard 3 étapes, autosave en temps réel. Du nom à la publication sans friction. Pas de formation requise.",
    icon: "⚡",
    visual: (
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-3 shadow-sm">
        {["Infos de base", "Lieu", "Récapitulatif"].map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-[var(--violet)] text-white" : "bg-black/5 text-[var(--muted)]"}`}>
              {i + 1}
            </div>
            <span className={`text-sm ${i === 0 ? "font-semibold text-[var(--ink)]" : "text-[var(--muted)]"}`}>{step}</span>
            {i === 0 && <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Actif</span>}
          </div>
        ))}
      </div>
    ),
  },
  {
    tag: "Tarification",
    title: "Tickets gratuits, vraiment gratuits",
    body: "0% de commission sur les tickets à 0€, toujours et sans limite de volume. Aucun don pré-coché, aucune surprise.",
    icon: "🎁",
    visual: (
      <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--muted)]">Entrée gratuite</span>
          <span className="text-sm font-bold text-[var(--green)]">0,00€</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--muted)]">Commission Evoly</span>
          <span className="text-sm font-bold text-[var(--green)]">0,00€</span>
        </div>
        <div className="border-t border-black/5 pt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--ink)]">Total acheteur</span>
          <span className="text-sm font-bold text-[var(--ink)]">0,00€ 🎉</span>
        </div>
      </div>
    ),
  },
  {
    tag: "Check-in",
    title: "QR scanner intégré",
    body: "PWA installable sur mobile. Liens temporaires pour vos bénévoles, sans compte requis. Feedback haptique instantané.",
    icon: "📱",
    visual: (
      <div className="bg-black rounded-2xl p-5 space-y-3 text-center shadow-lg">
        <div className="text-4xl">✅</div>
        <p className="text-white font-semibold text-sm">Billet valide</p>
        <p className="text-gray-400 text-xs">Marie Dupont — VIP</p>
        <div className="flex gap-1 justify-center mt-2">
          {["scan", "manuel", "stats"].map((t) => (
            <div key={t} className={`flex-1 text-center py-1.5 rounded-lg text-[10px] ${t === "scan" ? "bg-violet-600 text-white" : "text-gray-500"}`}>
              {t === "scan" ? "📷 Scanner" : t === "manuel" ? "⌨️ Manuel" : "📊 Stats"}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    tag: "Email marketing",
    title: "Communiquez avec vos acheteurs",
    body: "Éditeur visuel par blocs, automatisations J-7/J-1/J-0, campagnes segmentées avec stats d'ouverture. Plan Pro.",
    icon: "✉️",
    visual: (
      <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-sm space-y-3">
        {[
          { label: "Rappel J-7", status: "Actif", dot: "bg-green-400" },
          { label: "Rappel J-1", status: "Actif", dot: "bg-green-400" },
          { label: "Post-événement", status: "Désactivé", dot: "bg-gray-200" },
        ].map((a) => (
          <div key={a.label} className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.dot}`} />
            <span className="text-sm text-[var(--ink)] flex-1">{a.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === "Actif" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400"}`}>
              {a.status}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    tag: "Domaines",
    title: "Votre marque, votre domaine",
    body: "Sous-domaines personnalisés inclus. Domaines custom avec SSL automatique en Pro. Page événement à vos couleurs.",
    icon: "🌐",
    visual: (
      <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-sm space-y-3">
        {[
          { domain: "mon-asso.evoly.com", status: "✅ Actif", plan: "Free" },
          { domain: "tickets.monsite.com", status: "✅ SSL actif", plan: "Pro" },
        ].map((d) => (
          <div key={d.domain} className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--ink)]">{d.domain}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${d.plan === "Pro" ? "bg-[var(--violet-subtle)] text-[var(--violet)]" : "bg-gray-100 text-gray-500"}`}>
                {d.plan}
              </span>
            </div>
            <p className="text-[10px] text-green-600">{d.status}</p>
          </div>
        ))}
      </div>
    ),
  },
];

export function Features() {
  return (
    <section className="py-16 px-4 bg-white border-y border-black/5" id="features">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)] mb-2">Tout ce qu&apos;il vous faut</h2>
          <p className="text-[var(--muted)] text-sm">Sans payer une fortune.</p>
        </div>

        <div className="space-y-16">
          {features.map((feature, i) => (
            <div
              key={feature.tag}
              className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-8 md:gap-12 items-center`}
            >
              {/* Text */}
              <div className="flex-1 space-y-3">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--violet)] bg-[var(--violet-subtle)] px-3 py-1 rounded-full">
                  <span>{feature.icon}</span>
                  {feature.tag}
                </span>
                <h3 className="font-display text-2xl sm:text-3xl text-[var(--ink)] leading-tight">
                  {feature.title}
                </h3>
                <p className="text-[var(--muted)] leading-relaxed">{feature.body}</p>
              </div>

              {/* Visual */}
              <div className="flex-1 w-full max-w-sm mx-auto md:max-w-none">
                {feature.visual}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
