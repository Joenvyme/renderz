import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BillingTier,
  currentUtcPeriodKey,
  TRIAL_GENERATIONS_TOTAL,
  TRIAL_UPSCALES_TOTAL,
  isBillingUnlimitedEmail,
  TIER_LIMITS,
} from "./constants";

export interface BillingAccountRow {
  id: string;
  type: "personal" | "team";
  name: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
  tier: BillingTier;
  free_generations_used: number;
  last_upscale_utc_date: string | null;
}

export interface UsageMonthlyRow {
  renders_used: number;
  animations_used: number;
  upscales_used: number;
}

export async function getOrCreateBillingAccountForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<BillingAccountRow> {
  const { data: existing, error: fetchError } = await supabase
    .from("billing_account_member")
    .select(
      `
      billing_account_id,
      billing_account (
        id,
        type,
        name,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_subscription_status,
        tier,
        free_generations_used,
        last_upscale_utc_date
      )
    `
    )
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error("getOrCreateBillingAccountForUser fetch:", fetchError);
    throw new Error("Billing lookup failed");
  }

  const row = existing?.billing_account as BillingAccountRow | null | undefined;
  if (row?.id) {
    return row;
  }

  const { data: created, error: insertError } = await supabase
    .from("billing_account")
    .insert({
      type: "personal",
      tier: "trial",
    })
    .select(
      "id, type, name, stripe_customer_id, stripe_subscription_id, stripe_subscription_status, tier, free_generations_used, last_upscale_utc_date"
    )
    .single();

  if (insertError || !created) {
    console.error("create billing_account:", insertError);
    throw new Error("Failed to create billing account");
  }

  const { error: memberError } = await supabase.from("billing_account_member").insert({
    billing_account_id: created.id,
    user_id: userId,
    role: "owner",
  });

  if (memberError) {
    console.error("billing_account_member insert:", memberError);
    await supabase.from("billing_account").delete().eq("id", created.id);
    throw new Error("Failed to attach billing account");
  }

  return created as BillingAccountRow;
}

export async function getMonthlyUsage(
  supabase: SupabaseClient,
  billingAccountId: string,
  periodKey: string = currentUtcPeriodKey()
): Promise<UsageMonthlyRow> {
  const { data } = await supabase
    .from("usage_monthly")
    .select("renders_used, animations_used, upscales_used")
    .eq("billing_account_id", billingAccountId)
    .eq("period_key", periodKey)
    .maybeSingle();

  return {
    renders_used: data?.renders_used ?? 0,
    animations_used: data?.animations_used ?? 0,
    upscales_used: data?.upscales_used ?? 0,
  };
}

function limitsForTier(tier: BillingTier) {
  if (tier === "trial" || tier === "agency") return null;
  return TIER_LIMITS[tier];
}

export type QuotaBlock = { error: string; code: string; status: 403 };

export function assertCanStartImageRender(
  account: BillingAccountRow,
  usage: UsageMonthlyRow,
  userEmail: string | null | undefined
): QuotaBlock | null {
  if (isBillingUnlimitedEmail(userEmail)) return null;

  if (account.tier === "trial") {
    const combined = usage.renders_used + usage.animations_used;
    if (combined >= TRIAL_GENERATIONS_TOTAL) {
      return {
        error:
          `Quota d’essai atteint : ${TRIAL_GENERATIONS_TOTAL} créations (images + animations). Passez à Solo ou attendez la fin de l’essai.`,
        code: "TRIAL_GENERATIONS_EXHAUSTED",
        status: 403,
      };
    }
    return null;
  }

  const lim = limitsForTier(account.tier);
  if (!lim) return null;
  if (usage.renders_used >= lim.renders) {
    return {
      error: `Quota rendus atteint pour ce mois (${lim.renders}).`,
      code: "RENDERS_LIMIT",
      status: 403,
    };
  }
  return null;
}

export function assertCanStartAnimation(
  account: BillingAccountRow,
  usage: UsageMonthlyRow,
  userEmail: string | null | undefined
): QuotaBlock | null {
  if (isBillingUnlimitedEmail(userEmail)) return null;

  if (account.tier === "trial") {
    const combined = usage.renders_used + usage.animations_used;
    if (combined >= TRIAL_GENERATIONS_TOTAL) {
      return {
        error:
          `Quota d’essai atteint : ${TRIAL_GENERATIONS_TOTAL} créations (images + animations). Passez à Solo ou attendez la fin de l’essai.`,
        code: "TRIAL_GENERATIONS_EXHAUSTED",
        status: 403,
      };
    }
    return null;
  }

  const lim = limitsForTier(account.tier);
  if (!lim) return null;
  if (usage.animations_used >= lim.animations) {
    return {
      error: `Quota animations atteint pour ce mois (${lim.animations}).`,
      code: "ANIMATIONS_LIMIT",
      status: 403,
    };
  }
  return null;
}

export function assertCanUpscale(
  account: BillingAccountRow,
  usage: UsageMonthlyRow,
  userEmail: string | null | undefined
): QuotaBlock | null {
  if (isBillingUnlimitedEmail(userEmail)) return null;

  if (account.tier === "trial") {
    if (TRIAL_UPSCALES_TOTAL <= 0 || usage.upscales_used >= TRIAL_UPSCALES_TOTAL) {
      return {
        error:
          "Les upscales 4K ne sont pas inclus dans l’essai. Passez à Solo pour débloquer les upscales.",
        code: "TRIAL_UPSCALE_NOT_INCLUDED",
        status: 403,
      };
    }
    return null;
  }

  const lim = limitsForTier(account.tier);
  if (!lim) return null;
  if (usage.upscales_used >= lim.upscales) {
    return {
      error: `Quota upscales Magnific atteint pour ce mois (${lim.upscales}).`,
      code: "UPSCALES_LIMIT",
      status: 403,
    };
  }
  return null;
}

export async function recordSuccessfulImageRender(
  supabase: SupabaseClient,
  account: BillingAccountRow,
  email: string | null | undefined
): Promise<void> {
  if (isBillingUnlimitedEmail(email)) return;
  const periodKey = currentUtcPeriodKey();
  const { error } = await supabase.rpc("increment_usage_counter", {
    p_billing_account_id: account.id,
    p_period_key: periodKey,
    p_kind: "renders",
  });
  if (error) console.error("increment_usage_counter renders", error);
}

export async function recordSuccessfulAnimation(
  supabase: SupabaseClient,
  account: BillingAccountRow,
  email: string | null | undefined
): Promise<void> {
  if (isBillingUnlimitedEmail(email)) return;
  const periodKey = currentUtcPeriodKey();
  const { error } = await supabase.rpc("increment_usage_counter", {
    p_billing_account_id: account.id,
    p_period_key: periodKey,
    p_kind: "animations",
  });
  if (error) console.error("increment_usage_counter animations", error);
}

export async function recordSuccessfulUpscale(
  supabase: SupabaseClient,
  account: BillingAccountRow,
  email: string | null | undefined
): Promise<void> {
  if (isBillingUnlimitedEmail(email)) return;
  const periodKey = currentUtcPeriodKey();
  const { error } = await supabase.rpc("increment_usage_counter", {
    p_billing_account_id: account.id,
    p_period_key: periodKey,
    p_kind: "upscales",
  });
  if (error) console.error("increment_usage_counter upscales", error);
}
