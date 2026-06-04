"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarketingAuth } from "@/components/marketing/marketing-auth-provider";
import { TRIAL_DAYS, TRIAL_RENDERS } from "@/lib/billing/plans";

type ProfileTrialCtaProps = {
  profileName: string;
};

export function ProfileTrialCta({ profileName }: ProfileTrialCtaProps) {
  const { beginTrialSignup, scrollToHero } = useMarketingAuth();

  return (
    <section className="relative border-t border-border/50 bg-white py-16 sm:py-24 md:py-[clamp(5rem,12vw,8.125rem)]">
      <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mx-auto max-w-[22ch] text-balance text-[clamp(2rem,5vw,3.875rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-black">
            {TRIAL_DAYS}-day trial — built for {profileName.toLowerCase()}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground sm:text-base">
            ~{TRIAL_RENDERS} watermarked renders, no card required. Upload a plan or photo and see
            results in minutes.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3.5 sm:flex-row sm:items-center sm:justify-center">
            <Button
              type="button"
              onClick={beginTrialSignup}
              className="min-h-12 rounded-[4px] bg-black px-7 font-mono text-xs uppercase tracking-[0.1em] text-white hover:bg-[#1a1a1a]"
            >
              Start {TRIAL_DAYS}-day trial
              <ArrowRight className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={scrollToHero}
              className="min-h-12 rounded-[2px] border-border px-6 font-mono text-xs uppercase tracking-[0.1em] hover:bg-muted"
            >
              See examples
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
