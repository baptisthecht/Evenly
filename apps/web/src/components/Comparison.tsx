export function Comparison() {
  const rows = [
    { label: "Tickets gratuits", evFree: "0% ∞", evPro: "0% ∞", eb: "0%", note: null },
    { label: "Commission payants", evFree: "5% (30 offerts/mois)", evPro: "2.5% (150 offerts)", eb: "≈9.5% + 1.79€/billet", note: "frais cachés" },
    { label: "Abonnement", evFree: "Gratuit", evPro: "29€/mois", eb: "Variable", note: null },
    { label: "Branding retiré", evFree: false, evPro: true, eb: "Payant", note: null },
    { label: "Domaine custom", evFree: false, evPro: true, eb: false, note: null },
    { label: "Email marketing", evFree: false, evPro: true, eb: "Limité", note: null },
    { label: "Multi-orgs & rôles", evFree: true, evPro: true, eb: false, note: null },
    { label: "Transparence des frais", evFree: true, evPro: true, eb: false, note: null },
    { label: "QR Check-in intégré", evFree: true, evPro: true, eb: true, note: null },
  ];

  return (
    <section className="py-16 px-4" id="comparison">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)] mb-2">
            Pourquoi pas Eventbrite ?
          </h2>
          <p className="text-[var(--muted)] text-sm">La comparaison honnête.</p>
        </div>

        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-4 border-b border-black/5">
            <div className="p-4 text-xs font-medium text-[var(--muted)]" />
            <div className="p-4 text-xs font-semibold text-[var(--ink)] text-center border-l border-black/5">
              Evenly Free
            </div>
            <div className="p-4 text-xs font-semibold text-[var(--violet)] text-center bg-[var(--violet-subtle)] border-l border-[var(--violet)]/20">
              Evenly Pro
            </div>
            <div className="p-4 text-xs font-medium text-[var(--muted)] text-center border-l border-black/5 opacity-60">
              Eventbrite
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div key={row.label} className={`grid grid-cols-4 border-b border-black/5 last:border-0 ${i % 2 === 1 ? "bg-[var(--sand)]/50" : ""}`}>
              <div className="p-4 text-xs text-[var(--ink)]">
                {row.label}
                {row.note && <span className="block text-[10px] text-red-500 mt-0.5">{row.note}</span>}
              </div>
              <Cell value={row.evFree} />
              <Cell value={row.evPro} violet />
              <Cell value={row.eb} dim />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cell({ value, violet, dim }: { value: string | boolean; violet?: boolean; dim?: boolean }) {
  const base = `p-4 text-xs text-center border-l ${violet ? "border-[var(--violet)]/20 bg-[var(--violet-subtle)]" : "border-black/5"} ${dim ? "opacity-60" : ""}`;
  if (value === true) return <div className={base}><span className="text-[var(--green)]">✓</span></div>;
  if (value === false) return <div className={base}><span className="text-black/20">—</span></div>;
  return <div className={`${base} ${violet ? "text-[var(--violet)] font-medium" : "text-[var(--ink)]"}`}>{value}</div>;
}
