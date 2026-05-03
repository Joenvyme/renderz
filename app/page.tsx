"use client";

import { useState, useRef } from "react";
import { ArrowRight, RefreshCw, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AuroraText } from "@/components/ui/aurora-text";

import { AuthModal } from "@/components/auth-modal";
import { BeforeAfterSlider } from "@/components/before-after-slider";
import { MarketingPricingSection } from "@/components/marketing-pricing-section";
import { RenderGenerator } from "@/components/render-generator";
import { HeroPlanHoverCard } from "@/components/hero-plan-hover-card";
import { BrandLogo } from "@/components/brand-logo";
import { StripedPattern } from "@/components/magicui/striped-pattern";

import { useSession } from "@/lib/auth-client";
import { LANDING_RENDER_FORM_STORAGE_KEYS } from "@/lib/landing-render-form-storage";

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState("");

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
      <div className="pointer-events-none fixed inset-0 z-0 bg-white">
        <StripedPattern className="absolute inset-0 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]" />
      </div>
      <div
        ref={scrollContainerRef}
        className="relative z-10 h-[100dvh] max-h-[100dvh] overflow-y-auto scroll-smooth max-md:snap-none md:snap-y md:snap-mandatory"
      >
      {/* Section 1: Hero — mobile : hauteur au contenu ; md+ : min plein écran pour centrage vertical */}
      <div className="relative snap-start border-b border-border/40 bg-white md:min-h-[100dvh]">
        {/* Header — safe area encoche / barre d’état */}
        <header className="fixed top-0 left-0 right-0 z-[100] border-b border-border bg-white/80 backdrop-blur-sm pt-[env(safe-area-inset-top,0px)]">
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

      {/* Main Content — mobile : flux + scroll ; md+ : centré dans la hauteur utile */}
      <main className="relative z-10 flex w-full flex-col items-center overflow-x-hidden overflow-y-visible px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-[calc(env(safe-area-inset-top,0px)+3.5rem+1.25rem)] max-md:min-h-0 max-md:justify-start max-md:gap-y-3 max-md:pb-3 sm:px-4 sm:pt-[calc(env(safe-area-inset-top,0px)+4rem+1rem)] md:min-h-[100dvh] md:justify-center md:gap-y-5 md:overflow-y-auto md:pb-8 md:pt-[calc(env(safe-area-inset-top,0px)+4rem+1rem)] [@media(max-height:700px)]:gap-y-2 [@media(max-height:700px)_and_(min-width:768px)]:justify-start">
        <div className="mx-auto w-full max-w-4xl shrink-0 space-y-1.5 px-0 text-center sm:space-y-2.5 sm:px-3">
          <div className="flex justify-center px-1">
            <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 rounded-full border border-border/50 bg-white/50 px-2.5 py-1.5 text-center text-[11px] font-medium leading-snug text-black shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
              Made with heart in the Swiss mountains 🇨🇭
            </span>
          </div>
          <h1 className="inline-block max-w-full whitespace-nowrap text-[clamp(0.75rem,calc((100vw_-_2.5rem)/18),4.5rem)] font-bold leading-[1.1] tracking-tight text-foreground">
            Your <AuroraText>AI</AuroraText> <AuroraText>rendering</AuroraText> assistant.
          </h1>
          <p className="mx-auto max-w-lg text-pretty text-sm font-medium leading-relaxed text-muted-foreground sm:max-w-xl sm:text-base md:text-lg">
            Show concepts easily and get client approvals faster.
          </p>
        </div>

        <div className="mx-auto w-full max-w-xl shrink-0 touch-manipulation px-0 sm:max-w-2xl">
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
            compactBarClassName="w-full"
          />
        </div>

        <div className="mx-auto mt-6 w-full max-w-5xl shrink px-0 sm:mt-12 sm:px-1 md:mt-14 [@media(max-height:700px)_and_(min-width:768px)]:mt-6 [@media(max-height:700px)_and_(min-width:768px)]:max-w-3xl">
          <div className="grid min-h-0 w-full grid-cols-2 gap-2 sm:gap-4 md:gap-8 lg:gap-12">
            <HeroPlanHoverCard
              title="Plans to Renderz"
              priority
              compactMobileThumb
              className="mx-0 min-w-0 w-full"
              sizes="(max-width: 640px) 45vw, 50vw"
            />
            <HeroPlanHoverCard
              title="Pictures to Renderz"
              beforeSrc="/Hero image – 7.png"
              afterSrc="/Hero image – 8.png"
              beforeAlt="Chantier — bâtiment en cours de construction"
              compactMobileThumb
              className="mx-0 min-w-0 w-full"
              sizes="(max-width: 640px) 45vw, 50vw"
            />
          </div>
        </div>
      </main>
      </div>

      {/* Section 2: Landing page avec fond blanc */}
      <section className="relative snap-start border-t border-border/50 bg-white py-10 sm:py-16 md:flex md:min-h-[100dvh] md:items-center md:justify-center md:py-24">
        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
          <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
            <div className="mb-6 space-y-2 text-center sm:mb-10 md:mb-12">
              <h2 className="text-balance text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                Transform your <AuroraText>visions</AuroraText> into reality
              </h2>
              <p className="mx-auto max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base md:text-lg lg:text-xl">
                From sketches to photorealistic renders, and from 3D base models to stunning visualizations
              </p>
            </div>
            
            <div className="mx-auto max-w-4xl min-w-0">
              <BeforeAfterSlider
                beforeImage="/exemple-draw.png"
                afterImage="/exemple-render.jpeg"
                beforeLabel="Sketch"
                afterLabel="AI Render"
                hideLabels
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: 4K Upscaling Feature */}
      <section className="relative snap-start border-t border-border/50 bg-white py-10 sm:py-16 md:flex md:min-h-[100dvh] md:items-center md:justify-center md:py-24">
        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
          <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
            <div className="mb-6 space-y-2 text-center sm:mb-10 md:mb-12">
              <h2 className="text-balance text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                Upgrade to <AuroraText>4K</AuroraText> quality
              </h2>
              <p className="mx-auto max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base md:text-lg lg:text-xl">
                Transform your standard renders into ultra-high resolution 4K images with enhanced detail and clarity
              </p>
            </div>
            
            <div className="mx-auto max-w-4xl min-w-0">
              <BeforeAfterSlider
                beforeImage="/1K.png"
                afterImage="/4K.png"
                beforeLabel="LOW RESOLUTION"
                afterLabel="4K Upscaled"
                hideLabels
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Furniture Catalog Feature */}
      <section className="relative snap-start border-t border-border/50 bg-white py-10 sm:py-16 md:flex md:min-h-[100dvh] md:items-center md:justify-center md:py-24">
        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
          <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
            <div className="mb-6 space-y-2 text-center sm:mb-10 md:mb-12">
              <h2 className="text-balance text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                Enhance with <AuroraText>furniture</AuroraText> catalog
              </h2>
              <p className="mx-auto max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base md:text-lg lg:text-xl">
                Transform empty spaces into fully furnished renders by selecting items from your catalog
              </p>
            </div>
            
            <div className="mx-auto max-w-4xl min-w-0">
              <BeforeAfterSlider
                beforeImage="/render-empty.png"
                afterImage="/render-fourniture.png"
                beforeLabel="Empty"
                afterLabel="Fourniture"
                hideLabels
                className="w-full"
                beforeObjectFit="cover"
                afterObjectFit="cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing-section"
        className="relative snap-start border-t border-border/50 bg-white py-10 sm:py-16 md:flex md:min-h-[100dvh] md:items-center md:justify-center md:py-24"
      >
        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
          <div className="mx-auto w-full max-w-7xl min-w-0">
            <div className="mb-8 space-y-2 text-center sm:mb-12 md:mb-14">
              <h2 className="text-balance text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                Simple <AuroraText>pricing</AuroraText>
              </h2>
              <p className="mx-auto max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base md:text-lg lg:text-xl">
                Start for free. Upgrade when you need more.
              </p>
            </div>

            <MarketingPricingSection
              onGetStarted={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
              onContact={() => {
                const contactSection = document.getElementById("contact-section");
                contactSection?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative snap-start border-t border-border/50 bg-white py-12 sm:py-20 md:flex md:min-h-[100dvh] md:items-center md:justify-center md:py-28">
        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-5 text-center sm:space-y-8">
            <h2 className="text-balance text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
              Ready to <AuroraText>transform</AuroraText> your workflow?
            </h2>
            <p className="mx-auto max-w-xl text-pretty text-sm text-muted-foreground sm:text-base md:text-lg lg:text-xl">
              Start creating stunning renders in seconds. No design skills required.
            </p>
            <button
              type="button"
              onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-[2px] border border-border/50 bg-black px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-colors duration-200 hover:bg-black/85 active:bg-black/90 sm:min-h-12 sm:px-10 sm:py-4 sm:text-base"
            >
              Get started now
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-section" className="relative snap-start border-t border-border/50 bg-white py-10 sm:py-16 md:py-24">
        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6">
          <div className="mx-auto max-w-2xl space-y-6 sm:space-y-8">
            <div className="space-y-2 text-center">
              <h2 className="text-balance text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                Get in <AuroraText>touch</AuroraText>
              </h2>
              <p className="mx-auto max-w-xl text-pretty text-sm text-muted-foreground sm:text-base md:text-lg lg:text-xl">
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

      {/* Footer */}
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </div>
    </>
  );
}

