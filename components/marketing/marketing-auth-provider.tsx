"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/auth-modal";
import { useSession } from "@/lib/auth-client";
import {
  setPendingCheckoutPlan,
  settingsUrlForCheckoutPlan,
} from "@/lib/billing/pending-checkout";
import type { CheckoutPlanKey } from "@/lib/billing/plans";
import type { PricingInterval } from "@/components/pricing-plans-grid";
import { checkoutKeyForPlan } from "@/lib/billing/plans";

type AuthModalOptions = {
  mode?: "signin" | "signup";
  intent?: "default" | "subscribe";
  redirectAfter?: string;
};

type MarketingAuthContextValue = {
  openAuthModal: (opts?: AuthModalOptions) => void;
  /** Inscription + accès trial (tier trial en base). */
  beginTrialSignup: () => void;
  /** @deprecated Alias de beginTrialSignup */
  beginFreeSignup: () => void;
  beginPaidCheckout: (plan: CheckoutPlanKey, quantity?: number) => void;
  chooseSoloFromLanding: (interval: PricingInterval) => void;
  chooseStudioFromLanding: (interval: PricingInterval, seats: number) => void;
  scrollToHero: () => void;
};

const MarketingAuthContext = createContext<MarketingAuthContextValue | null>(null);

export function MarketingAuthProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<"signin" | "signup">("signin");
  const [authIntent, setAuthIntent] = useState<"default" | "subscribe">("default");
  const [authRedirectAfter, setAuthRedirectAfter] = useState<string | undefined>();

  const openAuthModal = useCallback((opts?: AuthModalOptions) => {
    setAuthInitialMode(opts?.mode ?? "signin");
    setAuthIntent(opts?.intent ?? "default");
    setAuthRedirectAfter(opts?.redirectAfter);
    setShowAuthModal(true);
  }, []);

  const beginPaidCheckout = useCallback(
    (plan: CheckoutPlanKey, quantity?: number) => {
      if (session?.user) {
        router.push(settingsUrlForCheckoutPlan(plan, quantity));
        return;
      }
      setPendingCheckoutPlan(plan, quantity);
      openAuthModal({
        mode: "signup",
        intent: "subscribe",
        redirectAfter: settingsUrlForCheckoutPlan(plan, quantity),
      });
    },
    [session?.user, router, openAuthModal]
  );

  const chooseSoloFromLanding = useCallback(
    (interval: PricingInterval) => {
      const plan = checkoutKeyForPlan("solo", interval);
      if (plan) beginPaidCheckout(plan);
    },
    [beginPaidCheckout]
  );

  const chooseStudioFromLanding = useCallback(
    (interval: PricingInterval, seats: number) => {
      const plan = checkoutKeyForPlan("studio", interval);
      if (plan) beginPaidCheckout(plan, seats);
    },
    [beginPaidCheckout]
  );

  const beginTrialSignup = useCallback(() => {
    if (session?.user) {
      router.push("/profile");
      return;
    }
    openAuthModal({ mode: "signup", redirectAfter: "/profile" });
  }, [session?.user, router, openAuthModal]);

  const scrollToHero = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname === "/") {
      document.getElementById("hero-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    router.push("/#hero-section");
  }, [router]);

  const value: MarketingAuthContextValue = {
    openAuthModal,
    beginTrialSignup,
    beginFreeSignup: beginTrialSignup,
    beginPaidCheckout,
    chooseSoloFromLanding,
    chooseStudioFromLanding,
    scrollToHero,
  };

  return (
    <MarketingAuthContext.Provider value={value}>
      {children}
      <AuthModal
        isOpen={showAuthModal}
        initialMode={authInitialMode}
        intent={authIntent}
        onClose={() => {
          setShowAuthModal(false);
          setAuthRedirectAfter(undefined);
          setAuthIntent("default");
        }}
        redirectAfterAuth={authRedirectAfter}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </MarketingAuthContext.Provider>
  );
}

export function useMarketingAuth(): MarketingAuthContextValue {
  const ctx = useContext(MarketingAuthContext);
  if (!ctx) {
    throw new Error("useMarketingAuth must be used within MarketingAuthProvider");
  }
  return ctx;
}
