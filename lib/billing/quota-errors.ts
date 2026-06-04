/** Codes renvoyés par les routes generate / video / upscale (403). */
export const QUOTA_ERROR_CODES = [
  "TRIAL_GENERATIONS_EXHAUSTED",
  "TRIAL_UPSCALE_NOT_INCLUDED",
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
  detail?: string;
};

export function presentationForQuotaCode(code: QuotaErrorCode): QuotaLimitPresentation {
  switch (code) {
    case "TRIAL_GENERATIONS_EXHAUSTED":
    case "FREE_GENERATIONS_EXHAUSTED":
      return {
        code,
        title: "Trial limit reached",
        description:
          "You’ve used all creations included in your 7-day trial (~50, watermarked). Subscribe to Solo for 200 renders/month without watermark.",
        upgradeLabel: "Upgrade to Solo",
        upgradeHref: "/settings?plan=solo_monthly#billing",
      };
    case "TRIAL_UPSCALE_NOT_INCLUDED":
    case "FREE_UPSCALE_MONTHLY":
      return {
        code,
        title: "4K upscale not included in trial",
        description:
          "4K upscales are included on Solo (20/month) and Studio. Upgrade to continue upscaling.",
        upgradeLabel: "Upgrade to Solo",
        upgradeHref: "/settings?plan=solo_monthly#billing",
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
