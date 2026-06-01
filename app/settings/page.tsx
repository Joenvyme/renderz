"use client";

import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession, signOut } from "@/lib/auth-client";
import { StripedPattern } from "@/components/magicui/striped-pattern";
import {
  ArrowLeft,
  User,
  Mail,
  Image,
  Loader2,
  LogOut,
  Camera,
  Trash2,
  Pencil,
  Wand2,
  CreditCard,
  CalendarX,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { SubscriptionPlans } from "@/components/subscription-plans";
import { QuotaCounterCards } from "@/components/quota-counter-cards";
import type { BillingPayload } from "@/lib/billing/billing-types";
import { formatQuotaCardsSubtitle } from "@/lib/billing/quota-subtitle";
import {
  consumePendingCheckoutPlan,
  isCheckoutPlanKey,
} from "@/lib/billing/pending-checkout";
import {
  shouldAutoCheckoutPlan,
  startStripeCheckout,
} from "@/lib/billing/stripe-checkout-client";

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending, refetch } = useSession();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [renderStats, setRenderStats] = useState({ standard: 0, upscaled: 0 });
  const [billing, setBilling] = useState<BillingPayload | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isConfirmDeleteAvatarOpen, setIsConfirmDeleteAvatarOpen] = useState(false);
  const [isConfirmDeleteAccountOpen, setIsConfirmDeleteAccountOpen] = useState(false);
  const [isConfirmCancelSubscriptionOpen, setIsConfirmCancelSubscriptionOpen] = useState(false);
  const [isCancelingSubscription, setIsCancelingSubscription] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoCheckoutStartedRef = useRef(false);

  const fetchBilling = useCallback(async () => {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/user/billing");
      const data = await res.json();
      if (res.ok) setBilling(data);
    } catch (e) {
      console.error("billing fetch", e);
    } finally {
      setBillingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchStats();
      fetchBilling();
    }
  }, [session, fetchBilling]);

  // Après Checkout Stripe : vérifier la session (quickstart) puis rafraîchir les quotas ; le webhook peut arriver avec un léger délai.
  useEffect(() => {
    if (!session || searchParams.get("checkout") !== "success") return;

    const sid = searchParams.get("session_id");
    let cancelled = false;

    void (async () => {
      if (sid) {
        try {
          const r = await fetch(`/api/stripe/session?session_id=${encodeURIComponent(sid)}`);
          if (r.ok) await fetchBilling();
        } catch {
          /* ignore */
        }
        if (!cancelled) {
          const url = new URL(window.location.href);
          url.searchParams.delete("session_id");
          router.replace(url.pathname + url.search, { scroll: false });
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (!cancelled) await fetchBilling();
    })();

    return () => {
      cancelled = true;
    };
  }, [session, searchParams, router, fetchBilling]);

  // Landing → auth → ?plan=pro_monthly : lance Checkout Stripe automatiquement.
  useEffect(() => {
    if (!session || billingLoading || !billing?.stripeConfigured || billing.unlimited) return;
    if (autoCheckoutStartedRef.current) return;

    const fromUrl = searchParams.get("plan");
    const plan = isCheckoutPlanKey(fromUrl) ? fromUrl : consumePendingCheckoutPlan();
    if (!plan) return;

    if (fromUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete("plan");
      const next = url.pathname + (url.search || "") + url.hash;
      router.replace(next, { scroll: false });
    }

    const tier = billing.tier as "free" | "pro" | "enterprise";
    if (!shouldAutoCheckoutPlan(plan, tier)) return;

    autoCheckoutStartedRef.current = true;
    void startStripeCheckout(plan).catch((e) => {
      autoCheckoutStartedRef.current = false;
      alert(e instanceof Error ? e.message : "Checkout error");
    });
  }, [session, billingLoading, billing, searchParams, router]);

  const handleCancelSubscriptionAtPeriodEnd = async () => {
    setIsCancelingSubscription(true);
    try {
      const res = await fetch("/api/stripe/subscription/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      await fetchBilling();
      setIsConfirmCancelSubscriptionOpen(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setIsCancelingSubscription(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/user/renders");
      const data = await res.json();
      if (data.renders) {
        const standard = data.renders.filter((r: any) => r.status === 'completed').length;
        const upscaled = data.renders.filter((r: any) => r.upscaled_image_url && r.upscaled_image_url !== r.generated_image_url).length;
        setRenderStats({ standard, upscaled });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setIsSavingName(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Update failed');
      }
      await refetch();
      setIsEditingName(false);
      setNewName("");
    } catch (error) {
      console.error('Update name error:', error);
      alert(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("File must be an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload error");
      await refetch();
      setAvatarPreview(null);
    } catch (error) {
      console.error("Avatar upload error:", error);
      alert(error instanceof Error ? error.message : "Upload error");
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setIsUploadingAvatar(true);
    try {
      const res = await fetch("/api/user/avatar", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete error");
      }
      await refetch();
    } catch (error) {
      console.error("Avatar delete error:", error);
      alert(error instanceof Error ? error.message : "Delete error");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) return;

    setIsDeletingAccount(true);
    try {
      const res = await fetch("/api/user/account", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      await signOut().catch(() => null);
      window.location.href = "/";
    } catch (error) {
      console.error("Delete account error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <StripedPattern className="absolute inset-0 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <button className="p-1.5 hover:bg-muted rounded transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <BrandLogo className="hover:opacity-90 transition-opacity" />
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-3 sm:px-6 pt-24 sm:pt-32 pb-16">
        <div className="max-w-7xl mx-auto w-full min-w-0 space-y-6 sm:space-y-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profil</h1>

          {/* Profile Info */}
          <Card className="p-4 sm:p-6 bg-white/5 backdrop-blur-[2px] border border-white">
            <h2 className="text-lg font-bold tracking-tight mb-4">Profile</h2>
            
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border overflow-hidden">
                  {isUploadingAvatar ? (
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  ) : avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : session.user.image ? (
                    <img src={session.user.image} alt={session.user.name || "Avatar"} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="w-10 h-10 rounded-full bg-black/70 flex items-center justify-center hover:bg-black/90 transition-colors"
                    title="Change photo"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                  {session.user.image && (
                    <button
                      onClick={() => setIsConfirmDeleteAvatarOpen(true)}
                      disabled={isUploadingAvatar}
                      className="w-10 h-10 rounded-full bg-red-500/70 flex items-center justify-center hover:bg-red-500/90 transition-colors"
                      title="Delete photo"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              {/* Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={session.user.name || "Your name"}
                        className="h-8 w-48 font-mono text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateName();
                          if (e.key === 'Escape') { setIsEditingName(false); setNewName(""); }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleUpdateName}
                        disabled={isSavingName || !newName.trim()}
                        className="h-8 px-2"
                      >
                        {isSavingName ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setIsEditingName(false); setNewName(""); }}
                        className="h-8 px-2"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium">{session.user.name || "User"}</span>
                      <button
                        onClick={() => { setNewName(session.user.name || ""); setIsEditingName(true); }}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title="Edit name"
                      >
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground font-mono text-sm">{session.user.email}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="max-w-7xl mx-auto w-full min-w-0 mt-10 sm:mt-14">
          {/* Abonnement & quotas — ancre #billing (liens depuis l’app) */}
          <Card
            id="billing"
            className="p-6 sm:p-8 lg:p-10 bg-white/5 backdrop-blur-[2px] border border-white scroll-mt-28 shadow-sm"
          >
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 shrink-0" />
              Abonnement & quotas
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Formules Stripe et consommation du mois (UTC).
            </p>
            {searchParams.get("checkout") === "success" && (
              <p className="text-sm font-mono text-green-600 mb-3">
                Paiement reçu — vos quotas seront mis à jour sous peu.
              </p>
            )}
            {searchParams.get("checkout") === "canceled" && (
              <p className="text-sm font-mono text-muted-foreground mb-3">Paiement annulé.</p>
            )}
            {billingLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : billing ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono uppercase px-2 py-0.5 border border-border rounded bg-muted/30">
                    {billing.unlimited ? "illimité" : billing.tier}
                  </span>
                  {billing.subscriptionStatus && (
                    <span className="text-xs font-mono text-muted-foreground">
                      Stripe: {billing.subscriptionStatus}
                    </span>
                  )}
                </div>
                {billing.unlimited ? (
                  <p className="text-sm font-mono text-muted-foreground">Aucune limite de quota (compte interne).</p>
                ) : billing.tier === "free" ? (
                  <QuotaCounterCards
                    variant="free"
                    subtitle={formatQuotaCardsSubtitle(billing)}
                    usage={billing.usage}
                    freeGenerationsMax={billing.free.generationsMax}
                  />
                ) : billing.limits ? (
                  <QuotaCounterCards
                    variant="paid"
                    subtitle={formatQuotaCardsSubtitle(billing)}
                    usage={billing.usage}
                    limits={billing.limits}
                  />
                ) : null}

                {!billing.unlimited && (
                  <div className="pt-4 border-t border-border/60 mt-4">
                    <SubscriptionPlans billing={billing} loading={false} />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Impossible de charger les quotas.</p>
            )}
          </Card>
        </div>

        <div className="max-w-7xl mx-auto w-full min-w-0 space-y-6 sm:space-y-8 mt-10 sm:mt-14">
          {/* Stats */}
          <Card className="p-4 sm:p-6 bg-white/5 backdrop-blur-[2px] border border-white">
            <h2 className="text-lg font-bold tracking-tight mb-4">Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/20 border border-border text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Image className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold font-mono">{renderStats.standard}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">Standard renders</p>
              </div>
              <div className="p-4 bg-muted/20 border border-border text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Wand2 className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold font-mono">{renderStats.upscaled}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">4K upscaled</p>
              </div>
            </div>
          </Card>

          {/* Account Actions */}
          <Card className="p-4 sm:p-6 bg-white/5 backdrop-blur-[2px] border border-white">
            <h2 className="text-lg font-bold tracking-tight mb-4">Account</h2>
            {billing &&
              billing.stripeConfigured &&
              !billing.unlimited &&
              (billing.tier === "pro" || billing.tier === "enterprise") &&
              billing.subscription?.cancelAtPeriodEnd && (
                <p className="text-xs font-mono text-muted-foreground mb-3 max-w-2xl leading-relaxed">
                  Résiliation déjà demandée : le renouvellement automatique est désactivé. Vous conservez l’accès jusqu’à
                  la date indiquée au-dessus des quotas.
                </p>
              )}
            <div className="flex flex-wrap gap-2">
              {billing &&
                billing.stripeConfigured &&
                !billing.unlimited &&
                (billing.tier === "pro" || billing.tier === "enterprise") &&
                billing.subscription &&
                !billing.subscription.cancelAtPeriodEnd && (
                  <Button
                    variant="outline"
                    className="font-mono text-xs border-amber-600/50 text-amber-800 hover:bg-amber-500/10"
                    onClick={() => setIsConfirmCancelSubscriptionOpen(true)}
                  >
                    <CalendarX className="w-3 h-3 mr-2" />
                    Résilier l’abonnement
                  </Button>
                )}
              <Button
                variant="outline"
                className="font-mono text-xs border-red-500/50 text-red-500 hover:bg-red-500/10"
                onClick={async () => {
                  await signOut();
                  window.location.href = "/";
                }}
              >
                <LogOut className="w-3 h-3 mr-2" />
                SIGN OUT
              </Button>
              <Button
                variant="outline"
                className="font-mono text-xs border-red-500 text-red-600 hover:bg-red-500/10"
                onClick={() => setIsConfirmDeleteAccountOpen(true)}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3 mr-2" />
                )}
                DELETE ACCOUNT
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <ConfirmActionDialog
        open={isConfirmDeleteAvatarOpen}
        title="Delete profile picture?"
        description="Your current profile picture will be removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        isLoading={isUploadingAvatar}
        onCancel={() => setIsConfirmDeleteAvatarOpen(false)}
        onConfirm={async () => {
          await handleDeleteAvatar();
          setIsConfirmDeleteAvatarOpen(false);
        }}
      />

      <ConfirmActionDialog
        open={isConfirmCancelSubscriptionOpen}
        title="Résilier l’abonnement ?"
        description="Stripe arrêtera le renouvellement automatique. Vous gardez l’accès et vos quotas jusqu’à la fin de la période déjà payée (date de renouvellement affichée au-dessus des compteurs). Aucun remboursement automatique — en cas de doute, utilisez aussi le portail client Stripe depuis les offres ci-dessus."
        confirmLabel="Confirmer la résiliation"
        cancelLabel="Annuler"
        danger
        isLoading={isCancelingSubscription}
        onCancel={() => setIsConfirmCancelSubscriptionOpen(false)}
        onConfirm={handleCancelSubscriptionAtPeriodEnd}
      />

      <ConfirmActionDialog
        open={isConfirmDeleteAccountOpen}
        title="Delete account permanently?"
        description="This action is irreversible. Your account and related data will be deleted."
        confirmLabel="Delete account"
        cancelLabel="Cancel"
        danger
        requiredText="DELETE"
        requiredTextLabel='Type "DELETE" to confirm account deletion.'
        isLoading={isDeletingAccount}
        onCancel={() => setIsConfirmDeleteAccountOpen(false)}
        onConfirm={async () => {
          await handleDeleteAccount();
          setIsConfirmDeleteAccountOpen(false);
        }}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
