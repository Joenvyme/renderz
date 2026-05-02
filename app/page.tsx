"use client";

import { useState, useRef } from "react";
import { ArrowRight, LogOut, RefreshCw, User } from "lucide-react";
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

import { useSession, signOut } from "@/lib/auth-client";
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
        className="relative z-10 h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth"
      >
      {/* Section 1: Hero — fond blanc unique (hauteur viewport, contenu centré) */}
      <div className="relative min-h-[100dvh] snap-start border-b border-border/40 bg-white">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandLogo priority className="hover:opacity-90 transition-opacity" />
          </div>
          {session ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link href="/profile">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-[2px] font-mono text-[10px] sm:text-xs px-2 sm:px-3"
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
                className="rounded-[2px] font-mono text-[10px] sm:text-xs px-2 sm:px-3"
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
              className="rounded-[2px] font-mono text-[10px] sm:text-xs px-3 sm:px-4"
              onClick={() => setShowAuthModal(true)}
            >
              SIGN IN
            </Button>
          )}
        </div>
      </header>

      {/* Main Content — centré verticalement dans la hauteur utile (sous header fixe) */}
      <main className="relative z-10 flex min-h-[100dvh] w-full flex-col items-center justify-center gap-y-3 overflow-y-auto overflow-x-hidden px-3 pb-5 pt-[calc(3.5rem+0.5rem)] sm:gap-y-4 sm:px-4 sm:pb-6 sm:pt-[calc(4rem+0.75rem)] md:gap-y-5 [@media(max-height:700px)]:gap-y-2 [@media(max-height:700px)]:py-2 [@media(max-height:700px)]:justify-start">
        <div className="mx-auto w-full max-w-4xl shrink-0 space-y-1.5 px-1 text-center sm:space-y-2.5 sm:px-3">
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-white/50 px-2.5 py-1 text-[11px] font-medium text-black shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
              Made with heart in the Swiss mountains 🇨🇭
            </span>
          </div>
          <h1 className="inline-block max-w-full whitespace-nowrap text-[clamp(0.75rem,calc((100vw_-_2.5rem)/18),4.5rem)] font-bold leading-[1.1] tracking-tight text-foreground">
            Your <AuroraText>AI</AuroraText> <AuroraText>rendering</AuroraText> assistant.
          </h1>
          <p className="mx-auto max-w-lg text-pretty text-sm font-medium leading-snug text-muted-foreground sm:max-w-xl sm:text-base md:text-lg">
            Show concepts easily and get client approvals faster.
          </p>
        </div>

        <div className="mx-auto w-full max-w-xl shrink-0 px-0 sm:max-w-2xl">
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

        <div className="mx-auto mt-10 w-full max-w-5xl shrink px-0.5 sm:mt-12 sm:px-1 md:mt-14 [@media(max-height:700px)]:mt-6 [@media(max-height:700px)]:max-w-3xl">
          <div className="grid min-h-0 w-full grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:gap-12">
            <HeroPlanHoverCard
              title="Plans to Renderz"
              priority
              className="mx-0 w-full"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
            <HeroPlanHoverCard
              title="Pictures to Renderz"
              beforeSrc="/Hero image – 7.png"
              afterSrc="/Hero image – 8.png"
              beforeAlt="Chantier — bâtiment en cours de construction"
              className="mx-0 w-full"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          </div>
        </div>
      </main>
      </div>

      {/* Section 2: Landing page avec fond blanc */}
      <section className="relative flex min-h-screen snap-start items-center border-t border-border/50 bg-white py-16 sm:py-24">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
            <div className="text-center space-y-2 mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-black">
                Transform your <AuroraText>visions</AuroraText> into reality
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
                From sketches to photorealistic renders, and from 3D base models to stunning visualizations
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
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
      <section className="relative flex min-h-screen snap-start items-center border-t border-border/50 bg-white py-16 sm:py-24">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
            <div className="text-center space-y-2 mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-black">
                Upgrade to <AuroraText>4K</AuroraText> quality
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
                Transform your standard renders into ultra-high resolution 4K images with enhanced detail and clarity
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
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
      <section className="relative flex min-h-screen snap-start items-center border-t border-border/50 bg-white py-16 sm:py-24">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
            <div className="text-center space-y-2 mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-black">
                Enhance with <AuroraText>furniture</AuroraText> catalog
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
                Transform empty spaces into fully furnished renders by selecting items from your catalog
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
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
        className="relative flex min-h-screen snap-start items-center border-t border-border/50 bg-white py-16 sm:py-24"
      >
        <div className="container mx-auto px-3 sm:px-6">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            <div className="text-center space-y-2 mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-black">
                Simple <AuroraText>pricing</AuroraText>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
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
      <section className="relative flex min-h-screen snap-start items-center border-t border-border/50 bg-white py-20 sm:py-28">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-black">
              Ready to <AuroraText>transform</AuroraText> your workflow?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto">
              Start creating stunning renders in seconds. No design skills required.
            </p>
            <button
              onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 rounded-[2px] border border-border/50 bg-black px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-colors duration-200 hover:bg-black/85 sm:px-10 sm:py-4 sm:text-base"
            >
              Get started now
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-section" className="relative snap-start border-t border-border/50 bg-white py-16 sm:py-24">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-black">
                Get in <AuroraText>touch</AuroraText>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto">
                Have a question or want to learn more? Send us a message and we'll get back to you.
              </p>
            </div>

            <Card className="rounded-[6px] border border-border/50 bg-white/50 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:p-8">
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
                  className="h-12 w-full rounded-[4px] font-mono text-xs tracking-wider transition-all !bg-[#000000] !opacity-100 hover:!bg-[#1a1a1a] sm:h-14 sm:text-sm"
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
      <footer className="border-t border-border/50 bg-white">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-col items-center justify-center gap-1">
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

