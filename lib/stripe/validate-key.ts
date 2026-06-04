export type StripeKeyMode = "test" | "live";

export type StripeKeyValidation =
  | { ok: true; mode: StripeKeyMode; key: string }
  | { ok: false; code: string; error: string };

/** Nettoie guillemets / espaces souvent collés par erreur dans Vercel ou .env.local. */
export function normalizeStripeSecretKey(raw: string | undefined): string | null {
  if (!raw) return null;
  let k = raw.trim();
  if (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'"))
  ) {
    k = k.slice(1, -1).trim();
  }
  // Retours ligne / espaces parasites (collage Vercel, .env multi-lignes)
  k = k.replace(/[\r\n\u00a0]/g, "").replace(/\s+/g, "");
  return k || null;
}

/**
 * Vérification locale avant appel API — évite des messages Stripe cryptiques.
 */
export function validateStripeSecretKey(raw: string | undefined): StripeKeyValidation {
  const key = normalizeStripeSecretKey(raw);
  if (!key) {
    return {
      ok: false,
      code: "STRIPE_KEY_MISSING",
      error:
        "STRIPE_SECRET_KEY est vide. En production (Vercel) : Settings → Environment Variables → Production, collez la clé secrète Live complète (sk_live_…).",
    };
  }

  if (key.startsWith("pk_")) {
    return {
      ok: false,
      code: "STRIPE_PUBLISHABLE_KEY",
      error:
        "STRIPE_SECRET_KEY contient une clé publique (pk_…). Utilisez la clé secrète (sk_test_… ou sk_live_…), pas la clé publishable.",
    };
  }

  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) {
    return {
      ok: false,
      code: "STRIPE_KEY_INVALID_PREFIX",
      error:
        "STRIPE_SECRET_KEY doit commencer par sk_test_ (local) ou sk_live_ (production). Vérifiez que vous avez copié la clé secrète entière depuis Stripe → Développeurs → Clés API.",
    };
  }

  if (key.length < 100) {
    return {
      ok: false,
      code: "STRIPE_KEY_TRUNCATED",
      error:
        "STRIPE_SECRET_KEY semble tronquée (trop courte). Recopiez la clé secrète complète, sans retour à la ligne ni espace en fin de ligne.",
    };
  }

  return {
    ok: true,
    mode: key.startsWith("sk_live_") ? "live" : "test",
    key,
  };
}

export function stripeKeyValidationErrorResponse(v: Extract<StripeKeyValidation, { ok: false }>) {
  return {
    code: v.code,
    error: v.error,
  };
}
