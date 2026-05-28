"use client";

import { useState } from "react";
import { ArrowRight, LogOut, RefreshCw, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AuroraText } from "@/components/ui/aurora-text";

import { AuthModal } from "@/components/auth-modal";
import { MarketingPricingSection } from "@/components/marketing-pricing-section";
import { RenderGenerator } from "@/components/render-generator";
import { AutoBeforeAfter } from "@/components/auto-before-after";
import { HeroIntro } from "@/components/hero-intro";
import { TrustedByCarousel } from "@/components/trusted-by-carousel";
import { BrandLogo } from "@/components/brand-logo";
import { CatalogShowcase } from "@/components/catalog-showcase";
import { VisionsCarousel } from "@/components/visions-carousel";
import { FourKShowcase } from "@/components/four-k-showcase";
import { MaterialOptionsShowcase } from "@/components/material-options-showcase";
import { RenderDetailControlShowcase } from "@/components/render-detail-control-showcase";
import { GlowBorder } from "@/components/ui/glow-border";
import { StripedPattern } from "@/components/magicui/striped-pattern";

import { signOut, useSession } from "@/lib/auth-client";
import { LANDING_RENDER_FORM_STORAGE_KEYS } from "@/lib/landing-render-form-storage";

/**
 * Padding vertical commun à toutes les sections "contenu" (hors hero & 4K cinematic).
 * Garantit un rythme régulier le long de la page.
 */
const SECTION_PADDING =
  "py-12 sm:py-20 md:py-28 lg:py-32";

/**
 * Espacement standard du bloc de titre (eyebrow / h2 / description)
 * → marge basse qui sépare le titre du contenu de la section.
 */
const HEADING_SPACING =
  "mb-8 space-y-2.5 text-center sm:mb-12 sm:space-y-3 md:mb-16 md:space-y-4 lg:mb-20";

const SECTION_H2_CLASSES =
  "text-balance text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl";

const SECTION_LEAD_CLASSES =
  "mx-auto max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg lg:text-xl";

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState("");

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToContact = () => {
    document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    setContactError("");
    setContactSuccess(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          message: contactMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error sending message");
      }

      setContactSuccess(true);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactMessage("");

      setTimeout(() => setContactSuccess(false), 5000);
    } catch (error) {
      setContactError(error instanceof Error ? error.message : "Error sending message");
    } finally {
      setIsSubmittingContact(false);
    }
  };

  return (
    <>
      {/* Fond strié fixé pour toute la page (visible derrière les sections au cas où l'une devienne transparente) */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-white">
        <StripedPattern className="absolute inset-0 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]" />
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* HEADER — en flux, suit le scroll naturellement (pas sticky/fixed) */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <header className="relative z-50 border-b border-border bg-white pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-2">
            <BrandLogo priority className="hover:opacity-90 transition-opacity" />
          </div>
          {session ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link href="/profile">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-10 touch-manipulation rounded-[2px] px-2 font-mono text-[10px] sm:min-h-9 sm:px-3 sm:text-xs"
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt="Profile"
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover sm:mr-1"
                    />
                  ) : (
                    <User className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                  )}
                  <span className="hidden sm:inline">DASHBOARD</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="min-h-10 touch-manipulation rounded-[2px] px-2 font-mono text-[10px] sm:min-h-9 sm:px-3 sm:text-xs"
                onClick={async () => {
                  await signOut();
                  window.location.reload();
                }}
              >
                <LogOut className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">SIGN OUT</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="min-h-10 touch-manipulation rounded-[2px] px-3 font-mono text-[10px] sm:min-h-9 sm:px-4 sm:text-xs"
              onClick={() => setShowAuthModal(true)}
            >
              SIGN IN
            </Button>
          )}
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PAGE CONTENT                                                       */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="relative z-10 overflow-x-hidden">
        {/* ─── Section 1: HERO ───────────────────────────────────────────── */}
        <section className="relative flex flex-col border-b border-border/40 bg-white max-sm:min-h-[82dvh] sm:min-h-[calc(100dvh-4rem)]">
          {/* Background animé — overflow isolé ici pour ne pas couper le glow du générateur */}
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

          {/* Mobile : hauteur naturelle, trusted dans le flux — Desktop : plein écran, trusted en bas */}
          <main className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-10 max-sm:min-h-[82dvh] sm:min-h-0 sm:flex-1 sm:justify-start sm:px-6 sm:py-0">
            <div className="flex w-full max-w-xl flex-col items-center sm:max-w-2xl sm:flex-1 sm:justify-center sm:py-14 md:py-16 lg:py-20">
              <HeroIntro className="w-full" />

              <div className="mt-10 w-full min-w-0 shrink-0 touch-manipulation sm:mt-10 md:mt-12">
                <GlowBorder duration={5} className="w-full max-w-full overflow-visible">
                  <RenderGenerator
                    compact
                    landingMode
                    onUnauthenticated={() => setShowAuthModal(true)}
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
              </div>

              <TrustedByCarousel className="relative z-0 mt-12 w-full min-w-0 max-w-3xl shrink-0 sm:hidden" />
            </div>

            <TrustedByCarousel className="relative z-0 mx-auto hidden w-full min-w-0 max-w-3xl shrink-0 sm:mt-auto sm:mb-10 sm:block md:mb-14" />
          </main>
        </section>

        {/* ─── Section 2: VISIONS CAROUSEL ───────────────────────────────── */}
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
              </div>
            </div>
          </div>
        </section>

        {/* ─── Section 3: 4K CINEMATIC SHOWCASE (gère son propre layout) ─── */}
        <FourKShowcase />

        {/* ─── Section 4: CATALOG SHOWCASE ───────────────────────────────── */}
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

        {/* ─── Section 5: MATERIAL OPTIONS ───────────────────────────────── */}
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
            </div>
          </div>
        </section>

        {/* ─── Section 6: RENDER DETAIL CONTROL ─────────────────────────── */}
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

        {/* ─── Section 7: PRICING ────────────────────────────────────────── */}
        <section
          id="pricing-section"
          className={`relative border-t border-border/50 bg-white ${SECTION_PADDING}`}
        >
          <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
            <div className="mx-auto w-full max-w-7xl min-w-0">
              <div className={HEADING_SPACING}>
                <h2 className={SECTION_H2_CLASSES}>
                  Simple <AuroraText>pricing</AuroraText>
                </h2>
                <p className={SECTION_LEAD_CLASSES}>
                  Start free. Scale when client output picks up.
                </p>
              </div>

              <MarketingPricingSection
                onGetStarted={scrollToTop}
                onContact={scrollToContact}
              />
            </div>
          </div>
        </section>

        {/* ─── Section 8: CTA ────────────────────────────────────────────── */}
        <section className={`relative border-t border-border/50 bg-white ${SECTION_PADDING}`}>
          <div className="container mx-auto w-full min-w-0 px-3 sm:px-6">
            <div className="mx-auto max-w-3xl space-y-5 text-center sm:space-y-8">
              <h2 className={SECTION_H2_CLASSES}>
                Your next client meeting starts <AuroraText>here</AuroraText>
              </h2>
              <p className="mx-auto max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
                Present better concepts this week. No 3D software, no render queue.
              </p>
              <button
                type="button"
                onClick={scrollToTop}
                className="inline-flex min-h-11 w-full max-w-xs touch-manipulation items-center justify-center gap-2 rounded-[2px] border border-border/50 bg-black px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-colors duration-200 hover:bg-black/85 active:bg-black/90 sm:w-auto sm:max-w-none sm:min-h-12 sm:px-10 sm:py-4 sm:text-base"
              >
                Start creating free
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ─── Section 9: CONTACT ────────────────────────────────────────── */}
        <section
          id="contact-section"
          className={`relative border-t border-border/50 bg-white ${SECTION_PADDING}`}
        >
          <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
            <div className="mx-auto max-w-2xl">
              <div className={HEADING_SPACING}>
                <h2 className={SECTION_H2_CLASSES}>
                  Get in <AuroraText>touch</AuroraText>
                </h2>
                <p className={SECTION_LEAD_CLASSES}>
                  Have a question or want to learn more? Send us a message and we'll get back to you.
                </p>
              </div>

              <Card className="rounded-[6px] border border-border/50 bg-white/50 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:p-8">
                <form onSubmit={handleContactSubmit} className="space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="contact-name" className="text-sm font-semibold text-foreground uppercase tracking-wider">
                      Name
                    </label>
                    <Input
                      id="contact-name"
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      className="w-full rounded-[2px]"
                      placeholder="Your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contact-email" className="text-sm font-semibold text-foreground uppercase tracking-wider">
                      Email
                    </label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                      className="w-full rounded-[2px]"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contact-phone" className="text-sm font-semibold text-foreground uppercase tracking-wider">
                      Phone Number
                    </label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      required
                      className="w-full rounded-[2px]"
                      placeholder="+41 XX XXX XX XX"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contact-message" className="text-sm font-semibold text-foreground uppercase tracking-wider">
                      Message
                    </label>
                    <Textarea
                      id="contact-message"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      required
                      className="w-full min-h-[120px] rounded-[2px] sm:min-h-[150px]"
                      placeholder="Your message..."
                    />
                  </div>

                  {contactError && (
                    <div className="rounded-[2px] border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600">
                      {contactError}
                    </div>
                  )}

                  {contactSuccess && (
                    <div className="rounded-[2px] border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-600">
                      Message sent successfully! We'll get back to you soon.
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmittingContact}
                    className="min-h-11 w-full touch-manipulation rounded-[4px] font-mono text-xs tracking-wider transition-all !bg-[#000000] !opacity-100 hover:!bg-[#1a1a1a] sm:min-h-14 sm:text-sm"
                  >
                    {isSubmittingContact ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>SEND MESSAGE</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </section>

        {/* ─── Footer ────────────────────────────────────────────────────── */}
        <footer className="border-t border-border/50 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          <div className="container mx-auto flex flex-col items-center justify-center gap-1 px-4 py-3 sm:px-6 sm:py-4">
            <p className="text-[10px] sm:text-xs font-mono text-muted-foreground text-center">
              <span className="hidden sm:inline">© 2026 RENDERZ · ARCHITECTURE + TECHNOLOGY</span>
              <span className="sm:hidden">© 2026 RENDERZ</span>
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground/80 text-center">
              Made with heart in the Swiss mountains 🇨🇭
            </p>
          </div>
        </footer>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </>
  );
}
