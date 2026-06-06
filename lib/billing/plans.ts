/**
 * Source unique : offres publiques, quotas affichés, clés Checkout Stripe (env côté serveur).
 * UI pricing + /api/stripe/checkout doivent importer depuis ce fichier.
 */

import type { BillingTier } from "@/lib/billing/constants";

export type PricingInterval = "monthly" | "yearly";

/** Identifiants produit (UI + billing métier). */
export type PlanId = "trial" | "solo" | "studio" | "agency";

/** Clés Checkout Stripe (body POST /api/stripe/checkout). */
export type CheckoutPlanKey =
  | "solo_monthly"
  | "solo_yearly"
  | "studio_monthly"
  | "studio_yearly";

export type PlanCtaKind = "trial" | "checkout" | "contact";

export type PlanPriceInterval = {
  /** Montant facturé par période (CHF). */
  amountChf: number;
  /** Équivalent mensuel affiché (annuel ÷ 12 ou = amount si mensuel). */
  monthlyEquivalentChf: number;
};

export type PlanDefinition = {
  id: PlanId;
  name: string;
  tagline: string;
  features: string[];
  highlighted: boolean;
  cta: {
    kind: PlanCtaKind;
    label: string;
  };
  /** Clé checkout Stripe (null = pas de price ID public). */
  checkoutKey: Partial<Record<PricingInterval, CheckoutPlanKey>> | null;
  /** Variable d’env serveur par intervalle (jamais NEXT_PUBLIC). */
  stripePriceEnvKeys: Partial<Record<PricingInterval, string>> | null;
  isPerSeat: boolean;
  minSeats: number;
  /** Affichage « custom » sans montant (Agency). */
  customPricing: boolean;
  pricing: Partial<Record<PricingInterval, PlanPriceInterval>>;
  /** Trial card only */
  trialDays?: number;
  trialRenders?: number;
  quotas?: {
    rendersPerMonth?: number | "shared_pool";
    upscalesPerMonth?: number;
    seats?: number;
  };
};

export const TRIAL_DAYS = 7;
export const TRIAL_RENDERS = 50;
export const ANNUAL_DISCOUNT_PERCENT = 20;
export const ANNUAL_DISCOUNT_LABEL = "−20 %";

export const TRIAL_CTA_LABEL = "Start Solo trial";

/** Puces du bandeau promo au-dessus des cartes (style Visualizee). */
export const TRIAL_PROMO_BULLETS = [
  `${TRIAL_DAYS}-day trial`,
  `~${TRIAL_RENDERS} renders`,
  "Solo pre-selected",
  "Watermarked images",
  "Personal use only",
] as const;

export const TRIAL_PROMO_FOOTNOTE =
  "Card on file · CHF 0 today · Cancel before day 7";

export const TRIAL_PROMO_SKIP_TRIAL_HINT = `Skip trial: save ${ANNUAL_DISCOUNT_PERCENT}% with annual billing`;

export const AGENCY_REMARK = {
  title: "Agency",
  subtitle: "Multi-seat studios & volume pricing",
  description: "Custom onboarding, shared workflows, and team billing.",
  ctaLabel: "Contact us",
} as const;

export const STUDIO_MIN_SEATS = 3;
export const STUDIO_DEFAULT_SEATS = 3;

/** Solo — 39/mo, 372/an (= 31/mo eq, −20 %). */
const SOLO_MONTHLY = 39;
const SOLO_YEARLY = 372;
const SOLO_YEARLY_EQ = 31;

/** Studio — 50/seat/mo, 480/seat/an (= 40/seat/mo eq). Headline min = 3 × 50 = 150. */
const STUDIO_PER_SEAT_MONTHLY = 50;
const STUDIO_PER_SEAT_YEARLY = 480;
const STUDIO_PER_SEAT_YEARLY_EQ = 40;

export const PLANS: PlanDefinition[] = [
  {
    id: "trial",
    name: "Trial",
    tagline: "Try before you subscribe",
    highlighted: false,
    customPricing: false,
    checkoutKey: null,
    stripePriceEnvKeys: null,
    isPerSeat: false,
    minSeats: 1,
    trialDays: TRIAL_DAYS,
    trialRenders: TRIAL_RENDERS,
    pricing: {
      monthly: { amountChf: 0, monthlyEquivalentChf: 0 },
      yearly: { amountChf: 0, monthlyEquivalentChf: 0 },
    },
    cta: { kind: "trial", label: "Start 7-day trial" },
    features: [
      `${TRIAL_DAYS}-day free trial`,
      `~${TRIAL_RENDERS} renders (watermarked)`,
      "Personal use only",
      "No card required to start",
    ],
  },
  {
    id: "solo",
    name: "Solo",
    tagline: "For individual creators",
    highlighted: true,
    customPricing: false,
    isPerSeat: false,
    minSeats: 1,
    checkoutKey: {
      monthly: "solo_monthly",
      yearly: "solo_yearly",
    },
    stripePriceEnvKeys: {
      monthly: "STRIPE_PRICE_SOLO_MONTHLY",
      yearly: "STRIPE_PRICE_SOLO_YEARLY",
    },
    pricing: {
      monthly: { amountChf: SOLO_MONTHLY, monthlyEquivalentChf: SOLO_MONTHLY },
      yearly: {
        amountChf: SOLO_YEARLY,
        monthlyEquivalentChf: SOLO_YEARLY_EQ,
      },
    },
    quotas: { rendersPerMonth: 200, upscalesPerMonth: 20, seats: 1 },
    cta: { kind: "checkout", label: TRIAL_CTA_LABEL },
    features: [
      `${TRIAL_DAYS}-day trial included`,
      "During trial: watermarked · personal use only",
      "1 seat · 200 renders / month after trial",
      "20 upscales / month",
      "Unlimited projects",
      "No watermark · commercial license when billed",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "For small teams",
    highlighted: false,
    customPricing: false,
    isPerSeat: true,
    minSeats: STUDIO_MIN_SEATS,
    checkoutKey: {
      monthly: "studio_monthly",
      yearly: "studio_yearly",
    },
    stripePriceEnvKeys: {
      monthly: "STRIPE_PRICE_STUDIO_MONTHLY",
      yearly: "STRIPE_PRICE_STUDIO_YEARLY",
    },
    pricing: {
      monthly: {
        amountChf: STUDIO_PER_SEAT_MONTHLY,
        monthlyEquivalentChf: STUDIO_PER_SEAT_MONTHLY,
      },
      yearly: {
        amountChf: STUDIO_PER_SEAT_YEARLY,
        monthlyEquivalentChf: STUDIO_PER_SEAT_YEARLY_EQ,
      },
    },
    quotas: { rendersPerMonth: "shared_pool", seats: STUDIO_MIN_SEATS },
    cta: { kind: "checkout", label: TRIAL_CTA_LABEL },
    features: [
      `${TRIAL_DAYS}-day trial included`,
      "During trial: watermarked · personal use only",
      "Shared render pool",
      "Furniture catalog",
      "Centralized billing · priority queue",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    tagline: "For larger teams (10+ seats)",
    highlighted: false,
    customPricing: true,
    checkoutKey: null,
    stripePriceEnvKeys: null,
    isPerSeat: false,
    minSeats: 10,
    pricing: {},
    cta: { kind: "contact", label: "Contact us" },
    features: [
      "10+ seats",
      "Custom quotas & SLA",
      "Dedicated support",
      "Invoicing & procurement",
    ],
  },
];

/** Cartes checkout : Solo (highlight) + Studio. Agency = remarque sous la grille. */
export const PRICING_GRID_PLANS = PLANS.filter((p) => p.id === "solo" || p.id === "studio");

export function getPlan(id: PlanId): PlanDefinition {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

export function checkoutPlanKeys(): CheckoutPlanKey[] {
  return [
    "solo_monthly",
    "solo_yearly",
    "studio_monthly",
    "studio_yearly",
  ];
}

export function isCheckoutPlanKey(value: string | null | undefined): value is CheckoutPlanKey {
  if (!value) return false;
  return (checkoutPlanKeys() as string[]).includes(value);
}

export function checkoutKeyForPlan(
  planId: Exclude<PlanId, "trial" | "agency">,
  interval: PricingInterval
): CheckoutPlanKey | null {
  const plan = getPlan(planId);
  return plan.checkoutKey?.[interval] ?? null;
}

export function stripeEnvKeyForCheckout(plan: CheckoutPlanKey): string {
  const map: Record<CheckoutPlanKey, string> = {
    solo_monthly: "STRIPE_PRICE_SOLO_MONTHLY",
    solo_yearly: "STRIPE_PRICE_SOLO_YEARLY",
    studio_monthly: "STRIPE_PRICE_STUDIO_MONTHLY",
    studio_yearly: "STRIPE_PRICE_STUDIO_YEARLY",
  };
  return map[plan];
}

export function tierFromCheckoutPlanKey(plan: CheckoutPlanKey): BillingTier {
  if (plan.startsWith("solo_")) return "solo";
  if (plan.startsWith("studio_")) return "studio";
  return "solo";
}

export function formatChf(n: number) {
  return new Intl.NumberFormat("fr-CH", {
    style: "decimal",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

/** Solo / Trial : prix affiché sur la carte. */
export function planHeadlineAmount(
  plan: PlanDefinition,
  interval: PricingInterval
): { main: number; suffix: string; sub?: string } {
  if (plan.customPricing) {
    return { main: 0, suffix: "Custom" };
  }
  if (plan.id === "trial") {
    return { main: 0, suffix: "CHF", sub: `${TRIAL_DAYS}-day trial` };
  }

  const p = plan.pricing[interval];
  if (!p) return { main: 0, suffix: "CHF" };

  if (interval === "monthly") {
    return { main: p.amountChf, suffix: "CHF / mo" };
  }
  return {
    main: p.amountChf,
    suffix: "CHF / year",
    sub: `${formatChf(p.monthlyEquivalentChf)} CHF / mo, billed yearly`,
  };
}

/**
 * Studio : headline = from (minSeats × per-seat), jamais le per-seat seul en grand.
 */
export function studioHeadlineAmount(
  interval: PricingInterval,
  seats: number
): { headline: string; sub: string; totalMonthlyChf: number } {
  const plan = getPlan("studio");
  const safeSeats = Math.max(seats, plan.minSeats);
  const per = plan.pricing[interval];
  if (!per) {
    return { headline: "Custom", sub: "", totalMonthlyChf: 0 };
  }

  const perSeatMonthly =
    interval === "monthly" ? per.amountChf : per.monthlyEquivalentChf;
  const totalMonthly = perSeatMonthly * safeSeats;

  const billed =
    interval === "monthly"
      ? `${formatChf(per.amountChf * safeSeats)} CHF / mo`
      : `${formatChf(per.amountChf * safeSeats)} CHF / year`;

  return {
    headline: `from ${formatChf(totalMonthly)} CHF / mo`,
    sub: `${formatChf(perSeatMonthly)} CHF / seat / mo · ${billed} for ${safeSeats} seats`,
    totalMonthlyChf: totalMonthly,
  };
}

export function studioCheckoutQuantity(seats: number): number {
  return Math.max(seats, STUDIO_MIN_SEATS);
}
