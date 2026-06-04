export type BillingTier = "trial" | "solo" | "studio" | "agency";

export const TIER_LIMITS: Record<
  Exclude<BillingTier, "trial" | "agency">,
  { renders: number; animations: number; upscales: number }
> = {
  solo: { renders: 200, animations: 200, upscales: 20 },
  studio: { renders: 600, animations: 150, upscales: 60 },
};

/** Trial : ~50 créations (images + animations) pendant la période d’essai. */
export const TRIAL_GENERATIONS_TOTAL = 50;

/** Trial : pas d’upscale 4K inclus (sorties watermark). */
export const TRIAL_UPSCALES_TOTAL = 0;

/** @deprecated Utiliser TRIAL_GENERATIONS_TOTAL */
export const FREE_GENERATIONS_PER_MONTH = TRIAL_GENERATIONS_TOTAL;

/** @deprecated Utiliser TRIAL_UPSCALES_TOTAL */
export const FREE_UPSCALES_PER_MONTH = TRIAL_UPSCALES_TOTAL;

/**
 * Comptes créateur : toujours sans plafond de quotas ni comptage d’usage (en plus de
 * `BILLING_UNLIMITED_EMAILS`).
 */
export const BILLING_CREATOR_UNLIMITED_EMAILS: readonly string[] = ["joey.montani@gmail.com"];

export function parseUnlimitedEmails(): string[] {
  const raw = process.env.BILLING_UNLIMITED_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isBillingUnlimitedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (BILLING_CREATOR_UNLIMITED_EMAILS.includes(normalized)) return true;
  const list = parseUnlimitedEmails();
  if (list.includes(normalized)) return true;
  return false;
}

export function currentUtcPeriodKey(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function utcDateString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function isPaidTier(tier: BillingTier): boolean {
  return tier === "solo" || tier === "studio";
}
