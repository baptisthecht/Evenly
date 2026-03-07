"use client";

import { useState, useTransition } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  validatePromoCodeAction,
  createFreeOrderAction,
  createPaymentIntentAction,
} from "@/actions/checkout";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface TicketType {
  id: string;
  name: string;
  priceCents: number;
  quantity: number | null;
  quantitySold: number;
  maxPerOrder: number;
  minPerOrder: number;
  isNominative: boolean;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
}

interface EventData {
  id: string;
  title: string;
  organization: { stripeAccountStatus: string };
  ticketTypes: TicketType[];
}

interface CartItem {
  ticketTypeId: string;
  quantity: number;
  ticketType: TicketType;
}

interface PromoResult {
  id: string;
  code: string;
  type: string;
  value: number;
  ticketTypeIds: string[];
}

interface HolderData {
  [ticketTypeId: string]: Array<{
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

export function CheckoutFlow({
  event,
  quantities,
  onQuantityChange,
  onBack,
  onSuccess,
}: {
  event: EventData;
  quantities: Record<string, number>;
  onQuantityChange: (q: Record<string, number>) => void;
  onBack: () => void;
  onSuccess: (orderId: string, magicToken: string) => void;
}) {
  const availableTickets = event.ticketTypes.filter(
    (tt) => (quantities[tt.id] ?? 0) > 0
  );
  const cartItems: CartItem[] = availableTickets
    .filter((tt) => (quantities[tt.id] ?? 0) > 0)
    .map((tt) => ({ ticketTypeId: tt.id, quantity: quantities[tt.id]!, ticketType: tt }));
  const totalItems = cartItems.reduce((a, i) => a + i.quantity, 0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [holderData, setHolderData] = useState<HolderData>({});
  const [promoInput, setPromoInput] = useState("");
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Stripe Elements state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  function getDiscountedPrice(tt: TicketType): number {
    if (!promoResult) return tt.priceCents;
    if (promoResult.ticketTypeIds.length > 0 && !promoResult.ticketTypeIds.includes(tt.id))
      return tt.priceCents;
    if (promoResult.type === "PERCENTAGE")
      return Math.round(tt.priceCents * (1 - promoResult.value / 100));
    if (promoResult.type === "FIXED") return Math.max(0, tt.priceCents - promoResult.value);
    if (promoResult.type === "FREE") return 0;
    return tt.priceCents;
  }

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.ticketType.priceCents * item.quantity,
    0
  );
  const discountedSubtotal = cartItems.reduce(
    (acc, item) => acc + getDiscountedPrice(item.ticketType) * item.quantity,
    0
  );
  const discount = subtotal - discountedSubtotal;
  const isFreeOrder = discountedSubtotal === 0;

  const commissionRate = 0.05;
  const estimatedFees = isFreeOrder
    ? 0
    : Math.round(discountedSubtotal * commissionRate);
  const total = discountedSubtotal + estimatedFees;

  async function handlePromoCode() {
    setPromoLoading(true);
    setPromoError(null);
    const result = await validatePromoCodeAction(event.id, promoInput);
    setPromoLoading(false);
    if (result.error) {
      setPromoError(result.error);
      setPromoResult(null);
    } else {
      setPromoResult(result.promo!);
    }
  }

  function updateHolder(
    ticketTypeId: string,
    index: number,
    field: string,
    value: string
  ) {
    setHolderData((prev) => {
      const current = prev[ticketTypeId] ?? [];
      const updated = [...current];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [ticketTypeId]: updated };
    });
  }

  function validate(): string | null {
    if (cartItems.length === 0) return "Sélectionnez au moins un billet.";
    if (!firstName.trim()) return "Prénom requis.";
    if (!lastName.trim()) return "Nom requis.";
    if (!email.trim() || !email.includes("@")) return "Email invalide.";
    return null;
  }

  function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    if (isFreeOrder) {
      // Free order: bypass Stripe entirely
      startTransition(async () => {
        const result = await createFreeOrderAction({
          eventId: event.id,
          buyerEmail: email,
          buyerFirstName: firstName,
          buyerLastName: lastName,
          buyerPhone: phone || null,
          promoCodeId: promoResult?.id ?? null,
          items: cartItems.map((item) => ({
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            holderData: item.ticketType.isNominative
              ? (holderData[item.ticketTypeId] ?? [])
              : undefined,
          })),
        });
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.orderId && result.magicToken)
          onSuccess(result.orderId, result.magicToken);
      });
    } else {
      // Paid order: create PaymentIntent, then show Stripe Elements
      startTransition(async () => {
        const result = await createPaymentIntentAction({
          eventId: event.id,
          buyerEmail: email,
          buyerFirstName: firstName,
          buyerLastName: lastName,
          buyerPhone: phone || null,
          promoCodeId: promoResult?.id ?? null,
          items: cartItems.map((item) => ({
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            holderData: item.ticketType.isNominative
              ? (holderData[item.ticketTypeId] ?? [])
              : undefined,
          })),
        });
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.clientSecret && result.orderId) {
          setClientSecret(result.clientSecret);
          setOrderId(result.orderId);
          setShowPaymentForm(true);
        }
      });
    }
  }

  // Once clientSecret is ready, render Stripe Elements
  if (showPaymentForm && clientSecret && orderId) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: { colorPrimary: "#7c3aed" },
          },
          locale: "fr",
        }}
      >
        <StripePaymentForm
          clientSecret={clientSecret}
          orderId={orderId}
          total={total}
          fees={estimatedFees}
          onBack={() => setShowPaymentForm(false)}
          onSuccess={onSuccess}
        />
      </Elements>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Retour"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-gray-900">Vos informations</h2>
      </div>

      <div className="p-5 space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {/* Ticket quantities */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Billets sélectionnés</h3>
          {event.ticketTypes.filter((tt) => (quantities[tt.id] ?? 0) > 0 || tt.quantity === null || tt.quantity - tt.quantitySold > 0).map((tt) => {
            const qty = quantities[tt.id] ?? 0;
            const available = tt.quantity !== null ? tt.quantity - tt.quantitySold : null;
            return (
              <div key={tt.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900">{tt.name}</p>
                  <p className="text-xs text-violet-600">
                    {tt.priceCents === 0 ? "Gratuit" : `${(tt.priceCents / 100).toFixed(2)}€`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onQuantityChange({ ...quantities, [tt.id]: Math.max(0, qty - 1) })}
                    disabled={qty <= 0}
                    className="w-7 h-7 rounded-full border border-gray-300 text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
                  >−</button>
                  <span className="w-4 text-center text-sm font-medium">{qty}</span>
                  <button
                    type="button"
                    onClick={() => onQuantityChange({ ...quantities, [tt.id]: Math.min(tt.maxPerOrder, qty + 1) })}
                    disabled={qty >= tt.maxPerOrder || (available !== null && qty >= available)}
                    className="w-7 h-7 rounded-full border border-gray-300 text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
                  >+</button>
                </div>
              </div>
            );
          })}
        </div>

        {totalItems > 0 && (
          <>
            {/* Promo code */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Code promo</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value.toUpperCase());
                    setPromoResult(null);
                    setPromoError(null);
                  }}
                  placeholder="PROMO2024"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  type="button"
                  onClick={handlePromoCode}
                  disabled={!promoInput || promoLoading}
                  className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {promoLoading ? "..." : "Appliquer"}
                </button>
              </div>
              {promoError && <p className="text-xs text-red-500">{promoError}</p>}
              {promoResult && (
                <p className="text-xs text-green-600 font-medium">
                  ✓ Code appliqué —{" "}
                  {promoResult.type === "PERCENTAGE"
                    ? `${promoResult.value}% de réduction`
                    : promoResult.type === "FREE"
                    ? "Gratuit !"
                    : `${(promoResult.value / 100).toFixed(2)}€ de réduction`}
                </p>
              )}
            </div>

            {/* Buyer info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Vos coordonnées</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom" required>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputCls}
                    placeholder="Jean"
                  />
                </Field>
                <Field label="Nom" required>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputCls}
                    placeholder="Dupont"
                  />
                </Field>
              </div>
              <Field label="Email" required>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="jean@exemple.com"
                />
              </Field>
              <Field label="Téléphone">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputCls}
                  placeholder="+33 6 12 34 56 78"
                />
              </Field>
            </div>

            {/* Nominative holders */}
            {cartItems
              .filter((i) => i.ticketType.isNominative)
              .map((item) => (
                <div key={item.ticketTypeId} className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Titulaires — {item.ticketType.name}
                  </h3>
                  {Array.from({ length: item.quantity }, (_, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <p className="text-xs font-medium text-gray-500">Billet {i + 1}</p>
                      {i === 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            updateHolder(item.ticketTypeId, 0, "firstName", firstName);
                            updateHolder(item.ticketTypeId, 0, "lastName", lastName);
                            updateHolder(item.ticketTypeId, 0, "email", email);
                          }}
                          className="text-xs text-violet-600 hover:underline"
                        >
                          Utiliser mes coordonnées
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Prénom"
                          value={holderData[item.ticketTypeId]?.[i]?.firstName ?? ""}
                          onChange={(e) => updateHolder(item.ticketTypeId, i, "firstName", e.target.value)}
                          className={`${inputCls} text-xs`}
                        />
                        <input
                          type="text"
                          placeholder="Nom"
                          value={holderData[item.ticketTypeId]?.[i]?.lastName ?? ""}
                          onChange={(e) => updateHolder(item.ticketTypeId, i, "lastName", e.target.value)}
                          className={`${inputCls} text-xs`}
                        />
                      </div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={holderData[item.ticketTypeId]?.[i]?.email ?? ""}
                        onChange={(e) => updateHolder(item.ticketTypeId, i, "email", e.target.value)}
                        className={`${inputCls} text-xs w-full`}
                      />
                    </div>
                  ))}
                </div>
              ))}

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span>{(subtotal / 100).toFixed(2)}€</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Réduction ({promoResult?.code})</span>
                  <span>−{(discount / 100).toFixed(2)}€</span>
                </div>
              )}
              {!isFreeOrder && (
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Commission Evoly (estimée)</span>
                  <span>~{(estimatedFees / 100).toFixed(2)}€</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
                <span>Total</span>
                <span>{isFreeOrder ? "Gratuit" : `${(total / 100).toFixed(2)}€`}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-5 pt-0">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || totalItems === 0}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isPending && (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isFreeOrder ? "Confirmer l'inscription" : "Procéder au paiement"}
        </button>
        <p className="text-center text-xs text-gray-400 mt-2">🔒 Paiement sécurisé par Stripe</p>
      </div>
    </div>
  );
}

// ─── Stripe Payment Form (rendered inside <Elements>) ────────────────────────

function StripePaymentForm({
  clientSecret,
  orderId,
  total,
  fees,
  onBack,
  onSuccess,
}: {
  clientSecret: string;
  orderId: string;
  total: number;
  fees: number;
  onBack: () => void;
  onSuccess: (orderId: string, magicToken: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);

  async function handlePay() {
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Erreur de paiement.");
      setProcessing(false);
      return;
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://app.evoly.me";

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${appUrl}/confirmation/${orderId}`,
      },
    });

    // confirmPayment redirects on success — if we get here it's an error
    if (confirmError) {
      setError(confirmError.message ?? "Paiement refusé.");
    }
    setProcessing(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Retour"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-gray-900">Paiement</h2>
      </div>

      <div className="p-5 space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {/* Recap */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-400 text-xs">
            <span>Commission Evoly</span>
            <span>{(fees / 100).toFixed(2)}€</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
            <span>Total à payer</span>
            <span>{(total / 100).toFixed(2)}€</span>
          </div>
        </div>

        {/* Stripe PaymentElement — handles card, Apple Pay, Google Pay automatically */}
        <PaymentElement
          onReady={() => setStripeReady(true)}
          options={{
            layout: "tabs",
            paymentMethodOrder: ["apple_pay", "google_pay", "card"],
          }}
        />

        <p className="text-xs text-gray-400 text-center">
          🔒 Paiement sécurisé par Stripe. Evoly ne stocke aucune donnée bancaire.
        </p>
      </div>

      <div className="p-5 pt-0">
        <button
          type="button"
          onClick={handlePay}
          disabled={processing || !stripe || !elements || !stripeReady}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {processing && (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {processing ? "Traitement en cours..." : !stripeReady ? "Chargement..." : `Payer ${(total / 100).toFixed(2)}€`}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors";
