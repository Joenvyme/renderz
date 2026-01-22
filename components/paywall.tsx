"use client";

import { useState } from "react";
import { X, Check, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRevenueCat } from "@/lib/hooks/use-revenuecat";
import { PRODUCT_IDS } from "@/lib/revenuecat";

type RecommendedPlan = 'starter' | 'pro' | 'premium' | null;
type PaywallContext = 'upgrade' | 'upscale' | 'limit_reached' | null;
type BillingPeriod = 'monthly' | 'yearly';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  recommendedPlan?: RecommendedPlan;
  context?: PaywallContext;
}

export function Paywall({ 
  isOpen, 
  onClose, 
  onSuccess,
  recommendedPlan = 'pro',
  context = null
}: PaywallProps) {
  const { products, purchaseProduct, isLoading, error } = useRevenueCat();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  if (!isOpen) return null;

  // Messages contextuels selon le contexte
  const getContextMessage = () => {
    switch (context) {
      case 'upscale':
        return {
          title: 'Upscale 4K disponible avec PRO',
          description: 'Passez à PRO pour accéder à l\'upscale 4K et à plus de fonctionnalités.'
        };
      case 'limit_reached':
        return {
          title: 'Limite de rendus gratuits atteinte',
          description: 'Vous avez utilisé vos 5 rendus gratuits. Passez à PRO pour continuer à créer.'
        };
      case 'upgrade':
        return {
          title: 'Upgradez votre plan',
          description: 'Débloquez plus de fonctionnalités avec un plan payant.'
        };
      default:
        return {
          title: 'Choisissez votre plan',
          description: 'Sélectionnez le plan qui vous convient le mieux.'
        };
    }
  };

  const contextMessage = getContextMessage();

  const handlePurchase = async (productId: string) => {
    setPurchasing(productId);
    try {
      const result = await purchaseProduct(productId);
      if (result.success) {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error("Purchase error:", err);
    } finally {
      setPurchasing(null);
    }
  };

  // Trouver les produits selon la période sélectionnée
  // Support pour les identifiants complets (starter_monthly) et simplifiés (monthly)
  const starterProduct = products.find((p) => 
    p && p.identifier && (
      billingPeriod === 'monthly' 
        ? (p.identifier === PRODUCT_IDS.STARTER_MONTHLY || 
           p.identifier.includes('starter_monthly') ||
           (p.identifier === 'monthly' && products.length <= 2)) // Fallback si seulement monthly/yearly
        : (p.identifier === PRODUCT_IDS.STARTER_YEARLY || 
           p.identifier.includes('starter_yearly') ||
           (p.identifier === 'yearly' && products.length <= 2)) // Fallback si seulement monthly/yearly
    )
  );
  
  const proProduct = products.find((p) => 
    p && p.identifier && (
      billingPeriod === 'monthly' 
        ? (p.identifier === PRODUCT_IDS.PRO_MONTHLY || 
           p.identifier.includes('pro_monthly') ||
           (p.identifier === 'monthly' && products.length <= 2)) // Fallback si seulement monthly/yearly
        : (p.identifier === PRODUCT_IDS.PRO_YEARLY || 
           p.identifier.includes('pro_yearly') ||
           (p.identifier === 'yearly' && products.length <= 2)) // Fallback si seulement monthly/yearly
    )
  );
  
  const premiumProduct = products.find((p) => 
    p && p.identifier && (
      billingPeriod === 'monthly' 
        ? (p.identifier === PRODUCT_IDS.PREMIUM_MONTHLY || 
           p.identifier.includes('premium_monthly') ||
           (p.identifier === 'monthly' && products.length <= 2)) // Fallback si seulement monthly/yearly
        : (p.identifier === PRODUCT_IDS.PREMIUM_YEARLY || 
           p.identifier.includes('premium_yearly') ||
           (p.identifier === 'yearly' && products.length <= 2)) // Fallback si seulement monthly/yearly
    )
  );

  // Trouver les produits annuels pour calculer les économies
  // Support pour les identifiants complets et simplifiés
  const starterMonthly = products.find((p) => 
    p && p.identifier && (
      p.identifier === PRODUCT_IDS.STARTER_MONTHLY || 
      p.identifier.includes('starter_monthly') ||
      (p.identifier === 'monthly' && products.length <= 2)
    )
  );
  const starterYearly = products.find((p) => 
    p && p.identifier && (
      p.identifier === PRODUCT_IDS.STARTER_YEARLY || 
      p.identifier.includes('starter_yearly') ||
      (p.identifier === 'yearly' && products.length <= 2)
    )
  );
  const proMonthly = products.find((p) => 
    p && p.identifier && (
      p.identifier === PRODUCT_IDS.PRO_MONTHLY || 
      p.identifier.includes('pro_monthly') ||
      (p.identifier === 'monthly' && products.length <= 2)
    )
  );
  const proYearly = products.find((p) => 
    p && p.identifier && (
      p.identifier === PRODUCT_IDS.PRO_YEARLY || 
      p.identifier.includes('pro_yearly') ||
      (p.identifier === 'yearly' && products.length <= 2)
    )
  );
  const premiumMonthly = products.find((p) => 
    p && p.identifier && (
      p.identifier === PRODUCT_IDS.PREMIUM_MONTHLY || 
      p.identifier.includes('premium_monthly') ||
      (p.identifier === 'monthly' && products.length <= 2)
    )
  );
  const premiumYearly = products.find((p) => 
    p && p.identifier && (
      p.identifier === PRODUCT_IDS.PREMIUM_YEARLY || 
      p.identifier.includes('premium_yearly') ||
      (p.identifier === 'yearly' && products.length <= 2)
    )
  );

  // Calculer les économies pour chaque plan
  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    if (!monthlyPrice || !yearlyPrice) return 0;
    const monthlyYearly = monthlyPrice * 12;
    return Math.round(((monthlyYearly - yearlyPrice) / monthlyYearly) * 100);
  };

  const starterSavings = starterMonthly && starterYearly 
    ? calculateSavings(starterMonthly.price, starterYearly.price) 
    : 17; // 2 mois gratuits = ~17%
  const proSavings = proMonthly && proYearly 
    ? calculateSavings(proMonthly.price, proYearly.price) 
    : 17;
  const premiumSavings = premiumMonthly && premiumYearly 
    ? calculateSavings(premiumMonthly.price, premiumYearly.price) 
    : 17;

  // Prix par défaut si les produits ne sont pas encore chargés depuis RevenueCat
  const defaultPrices = {
    starter: { monthly: 9.90, yearly: 99.00 },
    pro: { monthly: 29.90, yearly: 299.00 },
    premium: { monthly: 99.90, yearly: 999.00 }
  };

  // Utiliser les prix depuis RevenueCat ou les prix par défaut
  const starterPrice = billingPeriod === 'monthly' 
    ? (starterProduct?.price || defaultPrices.starter.monthly)
    : (starterProduct?.price || defaultPrices.starter.yearly);
  const proPrice = billingPeriod === 'monthly' 
    ? (proProduct?.price || defaultPrices.pro.monthly)
    : (proProduct?.price || defaultPrices.pro.yearly);
  const premiumPrice = billingPeriod === 'monthly' 
    ? (premiumProduct?.price || defaultPrices.premium.monthly)
    : (premiumProduct?.price || defaultPrices.premium.yearly);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="relative w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-background rounded-lg border shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-4 sm:p-6 z-10">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex-1 pr-2">
              <h2 className="text-lg sm:text-2xl font-bold">{contextMessage.title}</h2>
              {contextMessage.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{contextMessage.description}</p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Switch Mensuel/Annuel */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mt-3 sm:mt-4 flex-wrap">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Mensuel
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                billingPeriod === 'yearly' ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'yearly' ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annuel
            </span>
            {billingPeriod === 'yearly' && (
              <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] sm:text-xs font-semibold rounded-full">
                Économisez jusqu'à {Math.max(starterSavings, proSavings, premiumSavings)}%
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs sm:text-sm">
              {error}
            </div>
          )}

          {isLoading && products.length === 0 && (
            <div className="mb-4 p-3 sm:p-4 bg-muted/50 border border-muted rounded-lg text-xs sm:text-sm text-center">
              Chargement des offres...
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="mb-4 p-3 sm:p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 dark:text-yellow-400 text-xs sm:text-sm">
              ⚠️ Aucune offre disponible. Vérifiez votre configuration RevenueCat.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Plan STARTER */}
            <Card className={`relative p-4 sm:p-6 border-2 transition-colors ${
              recommendedPlan === 'starter' 
                ? 'border-primary bg-primary/5 shadow-lg sm:scale-105' 
                : 'hover:border-primary/50'
            }`}>
              {recommendedPlan === 'starter' && (
                <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 z-20">
                  <span className="bg-primary text-primary-foreground px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold">
                    RECOMMANDÉ
                  </span>
                </div>
              )}
              {billingPeriod === 'yearly' && starterSavings > 0 && (
                <div className="absolute -top-2 sm:-top-3 right-2 sm:right-4 z-20">
                  <span className="bg-green-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold">
                    -{starterSavings}%
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-bold">STARTER</h3>
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
              </div>
              <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl sm:text-3xl font-bold">
                    {starterProduct ? starterProduct.priceString : `€${starterPrice.toFixed(2)}`}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {billingPeriod === 'monthly' ? '/mois' : '/an'}
                  {billingPeriod === 'yearly' && starterMonthly && (
                    <span className="ml-2 text-[10px] sm:text-xs text-green-600 dark:text-green-400">
                      (€{(starterPrice / 12).toFixed(2)}/mois)
                    </span>
                  )}
                </div>
                {billingPeriod === 'yearly' && starterSavings > 0 && (
                  <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium">
                    Économisez {starterSavings}% vs mensuel
                  </div>
                )}
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">10 rendus standard/mois</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Tous les aspect ratios</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Reprompt illimité</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Upscale 4K</span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full h-10 sm:h-11 text-xs sm:text-sm"
                onClick={() => {
                  if (starterProduct) {
                    handlePurchase(starterProduct.identifier);
                  } else {
                    console.warn('Produit starter non disponible depuis RevenueCat');
                  }
                }}
                disabled={!starterProduct || purchasing === starterProduct.identifier || isLoading}
              >
                {purchasing === starterProduct?.identifier 
                  ? "Traitement..." 
                  : isLoading 
                    ? "Chargement..." 
                    : "Choisir STARTER"}
              </Button>
            </Card>

            {/* Plan PRO - Recommandé */}
            <Card className={`p-4 sm:p-6 border-2 relative transition-colors ${
              recommendedPlan === 'pro' || recommendedPlan === null
                ? 'border-primary bg-primary/5 shadow-lg sm:scale-105' 
                : 'hover:border-primary'
            }`}>
              <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 z-20">
                <span className="bg-primary text-primary-foreground px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold">
                  {recommendedPlan === 'pro' || recommendedPlan === null ? 'RECOMMANDÉ' : 'POPULAIRE'}
                </span>
              </div>
              {billingPeriod === 'yearly' && proSavings > 0 && (
                <div className="absolute -top-2 sm:-top-3 right-2 sm:right-4 z-20">
                  <span className="bg-green-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold">
                    -{proSavings}%
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-bold">PRO</h3>
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl sm:text-3xl font-bold">
                    {proProduct ? proProduct.priceString : `€${proPrice.toFixed(2)}`}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {billingPeriod === 'monthly' ? '/mois' : '/an'}
                  {billingPeriod === 'yearly' && proMonthly && (
                    <span className="ml-2 text-[10px] sm:text-xs text-green-600 dark:text-green-400">
                      (€{(proPrice / 12).toFixed(2)}/mois)
                    </span>
                  )}
                </div>
                {billingPeriod === 'yearly' && proSavings > 0 && (
                  <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium">
                    Économisez {proSavings}% vs mensuel
                  </div>
                )}
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">50 rendus standard/mois</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">10 upscales 4K inclus</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Tous les aspect ratios</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Reprompt illimité</span>
                </li>
              </ul>
              <Button
                className="w-full h-10 sm:h-11 text-xs sm:text-sm"
                onClick={() => {
                  if (proProduct) {
                    handlePurchase(proProduct.identifier);
                  } else {
                    console.warn('Produit pro non disponible depuis RevenueCat');
                  }
                }}
                disabled={!proProduct || purchasing === proProduct.identifier || isLoading}
              >
                {purchasing === proProduct?.identifier 
                  ? "Traitement..." 
                  : isLoading 
                    ? "Chargement..." 
                    : "Choisir PRO"}
              </Button>
            </Card>

            {/* Plan PREMIUM */}
            <Card className={`relative p-4 sm:p-6 border-2 transition-colors ${
              recommendedPlan === 'premium' 
                ? 'border-primary bg-primary/5 shadow-lg sm:scale-105' 
                : 'hover:border-primary/50'
            }`}>
              {recommendedPlan === 'premium' && (
                <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 z-20">
                  <span className="bg-primary text-primary-foreground px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold">
                    RECOMMANDÉ
                  </span>
                </div>
              )}
              {billingPeriod === 'yearly' && premiumSavings > 0 && (
                <div className="absolute -top-2 sm:-top-3 right-2 sm:right-4 z-20">
                  <span className="bg-green-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold">
                    -{premiumSavings}%
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-bold">PREMIUM</h3>
                <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
              </div>
              <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl sm:text-3xl font-bold">
                    {premiumProduct ? premiumProduct.priceString : `€${premiumPrice.toFixed(2)}`}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {billingPeriod === 'monthly' ? '/mois' : '/an'}
                  {billingPeriod === 'yearly' && premiumMonthly && (
                    <span className="ml-2 text-[10px] sm:text-xs text-green-600 dark:text-green-400">
                      (€{(premiumPrice / 12).toFixed(2)}/mois)
                    </span>
                  )}
                </div>
                {billingPeriod === 'yearly' && premiumSavings > 0 && (
                  <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium">
                    Économisez {premiumSavings}% vs mensuel
                  </div>
                )}
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">200 rendus standard/mois</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">50 upscales 4K inclus</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">5 upscales 10K inclus</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Tous les aspect ratios</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Reprompt illimité</span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full h-10 sm:h-11 text-xs sm:text-sm"
                onClick={() => {
                  if (premiumProduct) {
                    handlePurchase(premiumProduct.identifier);
                  } else {
                    console.warn('Produit premium non disponible depuis RevenueCat');
                  }
                }}
                disabled={!premiumProduct || purchasing === premiumProduct.identifier || isLoading}
              >
                {purchasing === premiumProduct?.identifier 
                  ? "Traitement..." 
                  : isLoading 
                    ? "Chargement..." 
                    : "Choisir PREMIUM"}
              </Button>
            </Card>
          </div>

          {/* Avantages Abonnement Annuel */}
          {billingPeriod === 'yearly' && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-green-500/10 to-primary/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-xs sm:text-sm mb-1">Avantages de l'abonnement annuel</h4>
                  <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-0.5 sm:space-y-1">
                    <li>• Économisez jusqu'à {Math.max(starterSavings, proSavings, premiumSavings)}% sur votre abonnement</li>
                    <li>• Paiement unique, pas de renouvellement mensuel</li>
                    <li>• Accès immédiat à toutes les fonctionnalités</li>
                    <li>• Annulation possible à tout moment</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 sm:mt-6 text-center text-[10px] sm:text-xs text-muted-foreground px-2">
            Les abonnements se renouvellent automatiquement. Annulez à tout moment.
          </div>
        </div>
      </div>
    </div>
  );
}
