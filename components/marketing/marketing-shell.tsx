"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { StripedPattern } from "@/components/magicui/striped-pattern";
import {
  MarketingDesktopNav,
  MarketingFooterNav,
  MarketingMobileNav,
} from "@/components/marketing/marketing-nav";
import { useMarketingAuth } from "@/components/marketing/marketing-auth-provider";
import { signOut, useSession } from "@/lib/auth-client";

type MarketingShellProps = {
  children: React.ReactNode;
};

export function MarketingShell({ children }: MarketingShellProps) {
  const { data: session } = useSession();
  const { openAuthModal } = useMarketingAuth();

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 bg-white">
        <StripedPattern className="absolute inset-0 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]" />
      </div>

      <header className="relative z-50 border-b border-border bg-white pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <BrandLogo priority className="hover:opacity-90 transition-opacity" />
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <MarketingDesktopNav />

            {session ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
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
                        className="h-4 w-4 rounded-full object-cover sm:mr-1 sm:h-5 sm:w-5"
                      />
                    ) : (
                      <User className="h-3 w-3 sm:mr-1 sm:h-4 sm:w-4" />
                    )}
                    <span className="hidden sm:inline">Dashboard</span>
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
                  <LogOut className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="min-h-10 touch-manipulation rounded-[2px] px-3 font-mono text-[10px] sm:min-h-9 sm:px-4 sm:text-xs"
                onClick={() => openAuthModal({ mode: "signin" })}
              >
                Sign in
              </Button>
            )}

            <MarketingMobileNav />
          </div>
        </div>
      </header>

      <div className="relative z-10 overflow-x-hidden">{children}</div>

      <footer className="relative z-10 border-t border-border/50 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
        <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-8 border-b border-border/40 pb-8">
            <MarketingFooterNav />
            <div className="mt-8">
              <Link
                href="/#pricing-section"
                className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/80 transition-colors hover:text-foreground sm:text-xs"
              >
                Pricing
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-1">
            <p className="text-center font-mono text-[10px] text-muted-foreground sm:text-xs">
              <span className="hidden sm:inline">
                © 2026 Renderz · Architecture + Technology
              </span>
              <span className="sm:hidden">© 2026 Renderz</span>
            </p>
            <p className="text-center text-[10px] text-muted-foreground/80 sm:text-xs">
              Made with heart in the Swiss mountains 🇨🇭
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
