import { NextResponse } from "next/server";

/**
 * Réponses JSON cohérentes quand l’API Stripe rejette la requête (clé invalide, etc.).
 */
export function jsonFromStripeCaughtError(e: unknown): NextResponse | null {
  if (typeof e !== "object" || e === null) return null;

  const name = e instanceof Error ? e.name : "";
  const type = "type" in e ? String((e as { type: unknown }).type) : "";
  const statusCode =
    "statusCode" in e && typeof (e as { statusCode: unknown }).statusCode === "number"
      ? (e as { statusCode: number }).statusCode
      : undefined;

  if (
    name === "StripeAuthenticationError" ||
    type === "StripeAuthenticationError" ||
    statusCode === 401
  ) {
    return NextResponse.json(
      {
        code: "STRIPE_INVALID_API_KEY",
        error:
          "Stripe refuse STRIPE_SECRET_KEY (clé invalide, révoquée ou tronquée). Production : Vercel → Project → Settings → Environment Variables → Production : STRIPE_SECRET_KEY=sk_live_… (clé secrète Live complète, sans guillemets). Les 4 STRIPE_PRICE_* doivent être des price_… créés en mode Live (Dashboard Stripe, interrupteur « Live » activé). Local : sk_test_… + prix Test. Ne mélangez pas test et live.",
      },
      { status: 503 }
    );
  }

  if (type === "StripePermissionError" || statusCode === 403) {
    return NextResponse.json(
      {
        code: "STRIPE_PERMISSION",
        error:
          "Clé Stripe sans permission suffisante pour cette opération. Utilisez une clé secrète standard (pas une clé restreinte incomplète) ou ajoutez les permissions Billing / Checkout.",
      },
      { status: 503 }
    );
  }

  return null;
}
