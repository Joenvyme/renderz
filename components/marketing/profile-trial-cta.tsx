"use client";

import { MarketingTrialCta } from "@/components/marketing/marketing-trial-cta";
import { TRIAL_DAYS } from "@/lib/billing/plans";

type ProfileTrialCtaProps = {
  profileName: string;
};

export function ProfileTrialCta({ profileName }: ProfileTrialCtaProps) {
  return (
    <MarketingTrialCta
      headline={`${TRIAL_DAYS}-day trial — built for ${profileName.toLowerCase()}`}
    />
  );
}
