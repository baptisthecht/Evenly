"use client";

import { useState, useMemo } from "react";

function formatEur(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export function FeeCalculator() {
  const [tickets, setTickets] = useState(200);
  const [price, setPrice] = useState(30);

  const calc = useMemo(() => {
    const revenue = tickets * price * 100; // in cents
    // Eventbrite: ~6.6% + 1.79€/ticket + 2.9% payment processing ≈ 9.5% + 1.79€/ticket
    const eb = Math.round(revenue * 0.095 + tickets * 179);
    // Evoly Free: 30 free, rest at 5%
    const freeQuota = Math.min(tickets, 30);
    const paid = Math.max(0, tickets - 30);
    const free = Math.round(paid * price * 100 * 0.05);
    // Evoly Pro: 150 free, rest at 2.5%, + 29€/month
    const paidPro = Math.max(0, tickets - 150);
    const pro = Math.round(paidPro * price * 100 * 0.025 + 2900);

    const saving = eb - free;
    const savingPct = revenue > 0 ? Math.round((saving / eb) * 100) : 0;

    return { revenue, eb, free, pro, saving, savingPct };
  }, [tickets, price]);

  return (
    <section className="py-16 px-4 bg-white border-y border-black/5" id="calculator">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)] mb-2">
            Calculez vos économies
          </h2>
          <p className="text-[var(--muted)] text-sm">Comparez avec Eventbrite en temps réel.</p>
        </div>

        {/* Sliders */}
        <div className="bg-[var(--sand)] rounded-2xl p-6 space-y-6 mb-6">
          <Slider
            label="Nombre de tickets"
            value={tickets}
            min={1} max={5000} step={10}
            display={tickets.toLocaleString("fr-FR")}
            onChange={setTickets}
          />
          <Slider
            label="Prix par ticket"
            value={price}
            min={1} max={500} step={1}
            display={`${price}€`}
            onChange={setPrice}
          />
          <div className="flex justify-between text-sm pt-1 border-t border-black/5">
            <span className="text-[var(--muted)]">Chiffre d&apos;affaires brut</span>
            <span className="font-semibold text-[var(--ink)]">{formatEur(calc.revenue)}</span>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ResultCard
            label="Eventbrite"
            fee={calc.eb}
            highlight={false}
            badge={null}
            dim
          />
          <ResultCard
            label="Evoly Free"
            fee={calc.free}
            highlight={true}
            badge={`−${calc.savingPct}%`}
          />
          <ResultCard
            label="Evoly Pro"
            fee={calc.pro}
            highlight={false}
            badge="Meilleur ROI"
            note="Inclut 29€/mois"
          />
        </div>
      </div>
    </section>
  );
}

function Slider({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  display: string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-[var(--muted)]">{label}</span>
        <span className="font-semibold text-[var(--ink)]">{display}</span>
      </div>
      <div className="relative h-2">
        <div className="absolute inset-0 rounded-full bg-black/8" />
        <div className="absolute left-0 top-0 h-full rounded-full bg-[var(--violet)]" style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          aria-label={label}
        />
        <div
          className="absolute top-1/2 w-4 h-4 rounded-full bg-white border-2 border-[var(--violet)] shadow -translate-y-1/2 -translate-x-1/2 pointer-events-none"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ResultCard({ label, fee, highlight, badge, dim, note }: {
  label: string; fee: number; highlight: boolean; badge: string | null; dim?: boolean; note?: string;
}) {
  return (
    <div className={`relative rounded-2xl p-5 border transition-all ${
      highlight
        ? "border-[var(--violet)] bg-[var(--violet-subtle)] shadow-md"
        : dim
        ? "border-black/5 bg-[var(--sand)] opacity-60"
        : "border-black/8 bg-white"
    }`}>
      {badge && (
        <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
          highlight ? "bg-[var(--violet)] text-white" : "bg-[var(--ink)] text-white"
        }`}>
          {badge}
        </span>
      )}
      <p className="text-xs text-[var(--muted)] mb-1 mt-1">{label}</p>
      <p className={`text-2xl font-semibold ${highlight ? "text-[var(--violet)]" : "text-[var(--ink)]"}`}>
        {(fee / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
      </p>
      <p className="text-[10px] text-[var(--muted)] mt-1">de commission</p>
      {note && <p className="text-[10px] text-[var(--muted)]">{note}</p>}
    </div>
  );
}
