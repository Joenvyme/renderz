"use client";

import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuroraText } from "@/components/ui/aurora-text";

import {
  MarketingAuthProvider,
  useMarketingAuth,
} from "@/components/marketing/marketing-auth-provider";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingPricingSection } from "@/components/marketing-pricing-section";
import { RenderGenerator } from "@/components/render-generator";
import { AutoBeforeAfter } from "@/components/auto-before-after";
import { HeroIntro } from "@/components/hero-intro";
import { TrustedByCarousel } from "@/components/trusted-by-carousel";
import { CatalogShowcase } from "@/components/catalog-showcase";
import { VisionsCarousel } from "@/components/visions-carousel";
import { FourKShowcase } from "@/components/four-k-showcase";
import { MaterialOptionsShowcase } from "@/components/material-options-showcase";
import { RenderDetailControlShowcase } from "@/components/render-detail-control-showcase";
import { LandingCta } from "@/components/landing-cta";
import { GlowBorder } from "@/components/ui/glow-border";

import { useSession } from "@/lib/auth-client";
import {
  LANDING_RENDER_FORM_STORAGE_KEYS,
  landingResumeAfterAuthUrl,
} from "@/lib/landing-render-form-storage";
import { TRIAL_DAYS, TRIAL_RENDERS } from "@/lib/billing/plans";
import {
  HEADING_SPACING,
  SECTION_H2_CLASSES,
  SECTION_LEAD_CLASSES,
  SECTION_PADDING,
} from "@/lib/marketing-layout";

function LandingPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const {
    openAuthModal,
    beginTrialSignup,
    chooseSoloFromLanding,
    chooseStudioFromLanding,
    scrollToHero,
  } = useMarketingAuth();

  useEffect(() => {
    if (!session?.user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("resumeGenerate") !== "1") return;
    document.getElementById("hero-section")?.scrollIntoView({ behavior: "smooth" });
    params.delete("resumeGenerate");
    const hash = window.location.hash;
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/?${qs}${hash}` : `/${hash}`);
  }, [session]);

  return (
    <>
      <section
        id="hero-section"
        className="relative flex flex-col border-b border-border/40 bg-white max-sm:min-h-[82dvh] sm:min-h-[calc(100dvh-4rem)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          style={{
            maskImage:
              "radial-gradient(ellipse 72% 62% at center, transparent 0%, transparent 38%, black 94%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 72% 62% at center, transparent 0%, transparent 38%, black 94%)",
          }}
        >
          <AutoBeforeAfter
            beforeSrc="/exemple-draw.png"
            afterSrc="/exemple-render.jpeg"
            fullBleed
            hideChrome
            priority
            mode="once"
            delayMs={2500}
            durationSec={2.5}
            className="opacity-30 motion-reduce:opacity-20"
          />
          <div className="absolute inset-0 bg-white/30" />
        </div>

        <main className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-10 max-sm:min-h-[82dvh] sm:min-h-0 sm:flex-1 sm:justify-start sm:px-6 sm:py-0">
          <div className="flex w-full max-w-xl flex-col items-center sm:max-w-2xl sm:flex-1 sm:justify-center sm:py-14 md:py-16 lg:py-20">
            <HeroIntro className="w-full" />

            <div className="mt-10 w-full min-w-0 shrink-0 touch-manipulation sm:mt-10 md:mt-12">
              <GlowBorder duration={5} className="w-full max-w-full overflow-visible">
                <RenderGenerator
                  compact
                  landingMode
                  onUnauthenticated={() =>
                    openAuthModal({
                      mode: "signup",
                      redirectAfter: landingResumeAfterAuthUrl(),
                    })
                  }
                  onGenerateSuccess={(payload) => {
                    const renderId = payload?.renderId;
                    if (renderId) {
                      localStorage.setItem(LANDING_RENDER_FORM_STORAGE_KEYS.RENDER_ID, renderId);
                      router.push(`/profile?studio=${renderId}`);
                    }
                  }}
                  compactOuterClassName="mb-0 sm:mb-4"
                  compactBarClassName="w-full bg-white"
                />
              </GlowBorder>
              <p className="mx-auto mt-3 max-w-lg text-center font-mono text-[11px] uppercase tracking-wide text-foreground/70 sm:mt-4 sm:text-xs">
                {TRIAL_DAYS}-day trial — ~{TRIAL_RENDERS} renders, no card required
              </p>
            </div>

            <TrustedByCarousel className="relative z-0 mt-12 w-full min-w-0 max-w-3xl shrink-0 sm:hidden" />
          </div>

          <TrustedByCarousel className="relative z-0 mx-auto hidden w-full min-w-0 max-w-3xl shrink-0 sm:mt-auto sm:mb-16 sm:block md:mb-20 lg:mb-24" />
        </main>
      </section>

      <section className={`relative border-t border-border/50 bg-white ${SECTION_PADDING}`}>
        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className={HEADING_SPACING}>
              <h2 className={SECTION_H2_CLASSES}>
                From sketch to photoreal, <AuroraText>same angle</AuroraText>, same design
              </h2>
              <p className={SECTION_LEAD_CLASSES}>
                Drop in a floor plan, site photo, or SketchUp screen. Get a geometry-faithful render back — not generic AI that warps your layout.
              </p>
            </div>

            <div className="mx-auto max-w-4xl min-w-0">
              <VisionsCarousel />
              <LandingCta
                onClick={scrollToHero}
                label="Start 7-day trial"
                className="mt-10 sm:mt-12 md:mt-14"
              />
            </div>
          </div>
        </div>
      </section>

      <FourKShowcase />

      <section className={`relative border-t border-border/50 bg-white ${SECTION_PADDING}`}>
        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
          <div className="mx-auto w-full max-w-5xl min-w-0">
            <div className={HEADING_SPACING}>
              <h2 className={SECTION_H2_CLASSES}>
                Furnish any space from your <AuroraText>catalog</AuroraText>
              </h2>
              <p className={SECTION_LEAD_CLASSES}>
                Place real products in the scene — chair, table, rug — photoreal and correctly scaled. No manual staging in 3D.
              </p>
            </div>

            <CatalogShowcase />
          </div>
        </div>
      </section>

      <section className={`relative border-t border-border/50 bg-white ${SECTION_PADDING}`}>
        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
          <div className="mx-auto w-full max-w-6xl min-w-0">
            <div className={HEADING_SPACING}>
              <h2 className={SECTION_H2_CLASSES}>
                Show oak vs walnut in the <AuroraText>same view</AuroraText>
              </h2>
              <p className={SECTION_LEAD_CLASSES}>
                Same camera, same layout — swap materials and moods in seconds so clients decide on the spot, not in the next meeting.
              </p>
            </div>

            <MaterialOptionsShowcase />
            <LandingCta
              onClick={scrollToHero}
              label="Create your first render"
              className="mt-10 sm:mt-12 md:mt-14"
            />
          </div>
        </div>
      </section>

      <section className={`relative border-t border-border/50 bg-white ${SECTION_PADDING}`}>
        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
          <div className="mx-auto w-full max-w-6xl min-w-0">
            <div className={HEADING_SPACING}>
              <h2 className={SECTION_H2_CLASSES}>
                Iterate without re-rendering from <AuroraText>scratch</AuroraText>
              </h2>
              <p className={SECTION_LEAD_CLASSES}>
                Add a piece, remove clutter, or shift a finish — describe the change in plain language and keep the rest of the scene intact.
              </p>
            </div>

            <RenderDetailControlShowcase />
          </div>
        </div>
      </section>

      <section
        id="pricing-section"
        className="relative bg-[#0a0a0b] py-12 sm:py-20 md:py-28 lg:py-32"
      >
        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
          <div className="mx-auto w-full max-w-7xl min-w-0">
            <MarketingPricingSection
              theme="dark"
              onStartTrial={beginTrialSignup}
              onChooseSolo={chooseSoloFromLanding}
              onChooseStudio={chooseStudioFromLanding}
            />
          </div>
        </div>
      </section>

      <section className="relative border-t border-border/50 bg-white py-16 sm:py-24 md:py-[clamp(5rem,12vw,8.125rem)]">
        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mx-auto max-w-[16ch] text-balance text-[clamp(2rem,5vw,3.875rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-black">
              Your next client meeting starts <AuroraText>here</AuroraText>
            </h2>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3.5 sm:flex-row sm:items-center sm:justify-center">
              <Button
                type="button"
                onClick={beginTrialSignup}
                className="min-h-12 rounded-[4px] bg-black px-7 font-mono text-xs uppercase tracking-[0.1em] text-white hover:bg-[#1a1a1a]"
              >
                Start 7-day trial
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
    </>
  );
}

export default function LandingPage() {
  return (
    <MarketingAuthProvider>
      <MarketingShell>
        <LandingPageContent />
      </MarketingShell>
    </MarketingAuthProvider>
  );
}
