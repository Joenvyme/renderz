export type BillingTier = "free" | "pro" | "enterprise";

export const TIER_LIMITS: Record<
  Exclude<BillingTier, "free">,
  { renders: number; animations: number; upscales: number }
> = {
  pro: { renders: 100, animations: 100, upscales: 25 },
  enterprise: { renders: 1000, animations: 250, upscales: 100 },
};

/** Gratuit : créations (images + animations) par mois civil UTC, compteur combiné dans usage_monthly. */
export const FREE_GENERATIONS_PER_MONTH = 5;

/** Gratuit : upscales Magnific par mois civil UTC (usage_monthly.upscales_used). */
export const FREE_UPSCALES_PER_MONTH = 1;

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
