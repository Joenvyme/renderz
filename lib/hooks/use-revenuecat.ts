"use client";

import { useState, useEffect, useCallback } from "react";
import { getPurchasesInstance, initializeRevenueCat, RevenueCatCustomerInfo, RevenueCatProduct, ENTITLEMENT_IDS } from "@/lib/revenuecat";
import { useSession } from "@/lib/auth-client";

export interface UseRevenueCatReturn {
  isLoading: boolean;
  isPro: boolean;
  customerInfo: RevenueCatCustomerInfo | null;
  products: RevenueCatProduct[];
  error: string | null;
  refreshCustomerInfo: () => Promise<void>;
  purchaseProduct: (productId: string) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
  presentPaywall: () => Promise<void>;
  presentCustomerCenter: () => Promise<void>;
}

export function useRevenueCat(): UseRevenueCatReturn {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<RevenueCatCustomerInfo | null>(null);
  const [products, setProducts] = useState<RevenueCatProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialiser RevenueCat et charger les infos
  // Bonne pratique RevenueCat: initialiser une fois, identifier l'utilisateur après
  const loadCustomerInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialiser RevenueCat (une seule fois, même sans userId)
      // Selon la doc: https://www.revenuecat.com/docs/getting-started/installation/web-sdk
      const purchases = await initializeRevenueCat(session?.user?.id);

      // Synchroniser RevenueCat avec Better Auth si l'utilisateur est connecté
      // (optionnel, mais recommandé pour la cohérence)
      if (session?.user?.id) {
        try {
          await fetch('/api/revenuecat/sync', {
            method: 'POST',
            credentials: 'include',
          });
        } catch (syncError) {
          console.error('RevenueCat sync error (non-blocking):', syncError);
        }
      }

      // Charger les infos client (bonne pratique: toujours vérifier après identification)
      const info = await purchases.getCustomerInfo();
      setCustomerInfo(info);

      // Vérifier l'entitlement PRO (bonne pratique: se baser sur CustomerInfo)
      const proEntitlement = info.entitlements[ENTITLEMENT_IDS.PRO];
      setIsPro(proEntitlement?.isActive === true);

      // Charger les produits disponibles via Offerings (bonne pratique RevenueCat)
      console.log('🔍 Fetching RevenueCat offerings...');
      const offerings = await purchases.getOfferings();
      
      console.log('📦 RevenueCat offerings response:', {
        hasCurrent: !!offerings.current,
        currentIdentifier: offerings.current?.identifier,
        allOfferings: Object.keys(offerings.all || {}),
        allOfferingsCount: Object.keys(offerings.all || {}).length,
      });
      
      if (offerings.current) {
        console.log('✅ Current offering found:', {
          identifier: offerings.current.identifier,
          packagesCount: offerings.current.availablePackages?.length || 0,
          packages: offerings.current.availablePackages?.map(p => ({
            identifier: p.identifier,
            packageType: p.packageType,
            hasRcBillingProduct: !!p.rcBillingProduct,
            hasWebBillingProduct: !!p.webBillingProduct,
            rcProductId: p.rcBillingProduct?.identifier,
            webProductId: p.webBillingProduct?.identifier,
          })) || [],
        });
        
        const availableProducts: RevenueCatProduct[] = [];
        for (const packageItem of offerings.current.availablePackages) {
          // Vérification de sécurité pour éviter les erreurs
          if (!packageItem) {
            console.warn('⚠️ Package item is undefined');
            continue;
          }
          
          // RevenueCat Web SDK utilise webBillingProduct ou rcBillingProduct
          // Priorité: webBillingProduct (pour Stripe) puis rcBillingProduct
          const product = packageItem.webBillingProduct || packageItem.rcBillingProduct;
          
          if (!product) {
            console.warn('⚠️ Package item has no product (webBillingProduct or rcBillingProduct):', {
              packageIdentifier: packageItem.identifier,
              packageType: packageItem.packageType,
              hasRcBilling: !!packageItem.rcBillingProduct,
              hasWebBilling: !!packageItem.webBillingProduct,
            });
            continue;
          }
          
          // Vérifier que le produit a un identifier
          if (!product.identifier) {
            console.warn('⚠️ Product missing identifier:', product);
            continue;
          }
          
          console.log('📦 Processing product:', {
            identifier: product.identifier,
            title: product.title || product.displayName,
            price: product.price,
            priceString: product.priceString,
            productType: product.productType,
          });
          
          availableProducts.push({
            identifier: product.identifier,
            description: product.description || "",
            title: product.title || product.displayName || product.identifier,
            price: product.price || 0,
            priceString: product.priceString || "€0.00",
            currencyCode: product.currencyCode || "EUR",
            introPrice: product.introPrice ? {
              price: product.introPrice.price || 0,
              priceString: product.introPrice.priceString || "€0.00",
              period: product.introPrice.period || "",
              cycles: product.introPrice.cycles || 0,
            } : undefined,
          });
        }
        setProducts(availableProducts);
        console.log('✅ RevenueCat products loaded:', availableProducts.length, availableProducts.map(p => p.identifier));
      } else {
        console.error('❌ No current offering available in RevenueCat');
        console.log('📋 Available offerings:', Object.keys(offerings.all || {}));
        console.log('💡 Solution: Create an Offering named "default" or "current" in RevenueCat Dashboard');
        console.log('💡 Make sure it contains packages linked to your Stripe products');
      }
    } catch (err) {
      console.error("RevenueCat error:", err);
      setError(err instanceof Error ? err.message : "Erreur RevenueCat");
      // En cas d'erreur, on considère que l'utilisateur n'est pas PRO
      setIsPro(false);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Recharger les infos client
  const refreshCustomerInfo = useCallback(async () => {
    await loadCustomerInfo();
  }, [loadCustomerInfo]);

  // Acheter un produit
  const purchaseProduct = useCallback(async (productId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);
      const purchases = await getPurchasesInstance();
      const offerings = await purchases.getOfferings();
      
      if (!offerings.current) {
        return { success: false, error: "Aucune offre disponible" };
      }

      // Trouver le package correspondant au produit
      const packageToPurchase = offerings.current.availablePackages.find(
        (pkg) => pkg.product.identifier === productId
      );

      if (!packageToPurchase) {
        return { success: false, error: "Produit non trouvé" };
      }

      const { customerInfo: newCustomerInfo } = await purchases.purchasePackage(packageToPurchase);
      setCustomerInfo(newCustomerInfo);

      // Vérifier l'entitlement PRO
      const proEntitlement = newCustomerInfo.entitlements[ENTITLEMENT_IDS.PRO];
      setIsPro(proEntitlement?.isActive === true);

      return { success: true };
    } catch (err: any) {
      console.error("Purchase error:", err);
      const errorMessage = err?.userCancelled 
        ? "Achat annulé" 
        : err?.message || "Erreur lors de l'achat";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Restaurer les achats
  const restorePurchases = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);
      const purchases = await getPurchasesInstance();
      const info = await purchases.restorePurchases();
      setCustomerInfo(info);

      // Vérifier l'entitlement PRO
      const proEntitlement = info.entitlements[ENTITLEMENT_IDS.PRO];
      setIsPro(proEntitlement?.isActive === true);

      return { success: true };
    } catch (err: any) {
      console.error("Restore error:", err);
      const errorMessage = err?.message || "Erreur lors de la restauration";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Présenter le paywall
  const presentPaywall = useCallback(async () => {
    try {
      const purchases = await getPurchasesInstance();
      const offerings = await purchases.getOfferings();
      
      if (!offerings.current) {
        setError("Aucune offre disponible");
        return;
      }

      // RevenueCat Web SDK ne supporte pas directement le paywall UI
      // On utilisera notre propre composant Paywall
      console.log("Paywall should be presented via Paywall component");
    } catch (err) {
      console.error("Paywall error:", err);
      setError(err instanceof Error ? err.message : "Erreur paywall");
    }
  }, []);

  // Présenter le Customer Center
  const presentCustomerCenter = useCallback(async () => {
    try {
      const purchases = await getPurchasesInstance();
      const info = await purchases.getCustomerInfo();
      
      if (info.managementURL) {
        window.open(info.managementURL, "_blank");
      } else {
        setError("URL de gestion non disponible");
      }
    } catch (err) {
      console.error("Customer Center error:", err);
      setError(err instanceof Error ? err.message : "Erreur Customer Center");
    }
  }, []);

  // Charger les infos au montage et quand la session change
  useEffect(() => {
    if (session?.user?.id) {
      loadCustomerInfo();
    }
  }, [session?.user?.id, loadCustomerInfo]);

  return {
    isLoading,
    isPro,
    customerInfo,
    products,
    error,
    refreshCustomerInfo,
    purchaseProduct,
    restorePurchases,
    presentPaywall,
    presentCustomerCenter,
  };
}

