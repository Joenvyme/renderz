/** Réponse de GET /api/user/billing — partagée UI (profil, paramètres). */
export type BillingPayload = {
  tier: string;
  stripeConfigured: boolean;
  subscriptionStatus: string | null;
  /** Données live Stripe quand un abonnement est lié (sinon null). */
  subscription: {
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  unlimited: boolean;
  period: { key: string };
  usage: { renders: number; animations: number; upscales: number };
  limits: { renders: number; animations: number; upscales: number } | null;
  free: {
    generationsUsed: number;
    generationsMax: number;
    periodKey: string;
    upscalesUsed: number;
    upscalesMax: number;
  };
};
