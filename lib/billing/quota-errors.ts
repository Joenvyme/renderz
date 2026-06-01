/** Codes renvoyés par les routes generate / video / upscale (403). */
export const QUOTA_ERROR_CODES = [
  "FREE_GENERATIONS_EXHAUSTED",
  "FREE_UPSCALE_MONTHLY",
  "RENDERS_LIMIT",
  "ANIMATIONS_LIMIT",
  "UPSCALES_LIMIT",
] as const;

export type QuotaErrorCode = (typeof QUOTA_ERROR_CODES)[number];

export function isQuotaErrorCode(code: unknown): code is QuotaErrorCode {
  return typeof code === "string" && (QUOTA_ERROR_CODES as readonly string[]).includes(code);
}

export type QuotaLimitPresentation = {
  code: QuotaErrorCode;
  title: string;
  description: string;
  upgradeLabel: string;
  upgradeHref: string;
  /** Message API optionnel (détail technique). */
  detail?: string;
};

export function presentationForQuotaCode(code: QuotaErrorCode): QuotaLimitPresentation {
  switch (code) {
    case "FREE_GENERATIONS_EXHAUSTED":
      return {
        code,
        title: "Monthly free limit reached",
        description:
          "You’ve used all 5 free creations this month (images + animations). Upgrade to Pro for 100 renders and 100 animations per month, or wait until next month (UTC).",
        upgradeLabel: "Upgrade to Pro",
        upgradeHref: "/settings?plan=pro_monthly#billing",
      };
    case "FREE_UPSCALE_MONTHLY":
      return {
        code,
        title: "Free 4K upscale used",
        description:
          "Your free plan includes 1 Magnific 4K upscale per month. Upgrade to Pro for 25 upscales per month, or try again next month (UTC).",
        upgradeLabel: "Upgrade to Pro",
        upgradeHref: "/settings?plan=pro_monthly#billing",
      };
    case "RENDERS_LIMIT":
      return {
        code,
        title: "Render quota reached",
        description:
          "You’ve used all image renders included in your plan for this billing month. Upgrade or manage your subscription to keep creating.",
        upgradeLabel: "View plans & billing",
        upgradeHref: "/settings#billing",
      };
    case "ANIMATIONS_LIMIT":
      return {
        code,
        title: "Animation quota reached",
        description:
          "You’ve used all video animations included in your plan for this month. Upgrade or manage your subscription to continue.",
        upgradeLabel: "View plans & billing",
        upgradeHref: "/settings#billing",
      };
    case "UPSCALES_LIMIT":
      return {
        code,
        title: "4K upscale quota reached",
        description:
          "You’ve used all Magnific 4K upscales included in your plan for this month. Upgrade or manage your subscription for more.",
        upgradeLabel: "View plans & billing",
        upgradeHref: "/settings#billing",
      };
  }
}

export function parseQuotaErrorFromApi(
  status: number,
  body: unknown
): QuotaLimitPresentation | null {
  if (status !== 403 || !body || typeof body !== "object") return null;
  const code = (body as { code?: unknown }).code;
  if (!isQuotaErrorCode(code)) return null;
  const detail =
    typeof (body as { error?: unknown }).error === "string"
      ? (body as { error: string }).error
      : undefined;
  return { ...presentationForQuotaCode(code), detail };
}
