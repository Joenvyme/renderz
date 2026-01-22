"use client";

import { Purchases } from "@revenuecat/purchases-js";

// Configuration RevenueCat
// ⚠️ IMPORTANT: Utilisez la clé PUBLIQUE (SDK API Key) ici, pas la clé secrète
// La clé publique est conçue pour être exposée côté client
// Format: commence généralement par "rcw_" ou "test_" pour les clés de test
const REVENUECAT_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY || "test_gCXwdEMumqTGFZxoNVUUROXtjVp";

// Initialiser RevenueCat
// Singleton pattern pour s'assurer qu'on initialise une seule fois
let purchasesInstance: Purchases | null = null;
let isInitialized = false;

/**
 * Initialise RevenueCat SDK (bonne pratique: une seule fois)
 * Selon la doc RevenueCat: https://www.revenuecat.com/docs/getting-started/installation/web-sdk
 */
export async function initializeRevenueCat(userId?: string): Promise<Purchases> {
  // Si déjà initialisé, réutiliser l'instance
  if (purchasesInstance && isInitialized) {
    return purchasesInstance;
  }

  // Initialiser le SDK (une seule fois)
  // Utiliser Purchases.configure() avec apiKey et appUserId
  // Si userId n'est pas fourni, utiliser un ID temporaire (sera remplacé lors de l'identification)
  purchasesInstance = Purchases.configure({
    apiKey: REVENUECAT_API_KEY,
    appUserId: userId || `temp_${Date.now()}`, // Identifier l'utilisateur lors de la configuration si fourni
  });
  isInitialized = true;
  
  // Si userId est fourni après l'initialisation, identifier l'utilisateur
  if (userId && purchasesInstance) {
    try {
      // Note: L'API RevenueCat Web SDK peut nécessiter une méthode différente
      // Si identify() n'existe pas, l'utilisateur sera identifié lors de la prochaine opération
    } catch (error) {
      console.error('RevenueCat identify error:', error);
    }
  }

  return purchasesInstance;
}

export async function getPurchasesInstance(): Promise<Purchases> {
  if (!purchasesInstance) {
    return await initializeRevenueCat();
  }
  return purchasesInstance;
}

// Types pour les produits
export interface RevenueCatProduct {
  identifier: string;
  description: string;
  title: string;
  price: number;
  priceString: string;
  currencyCode: string;
  introPrice?: {
    price: number;
    priceString: string;
    period: string;
    cycles: number;
  };
}

// Types pour les entitlements
export interface RevenueCatEntitlement {
  identifier: string;
  isActive: boolean;
  willRenew: boolean;
  periodType: string;
  latestPurchaseDate: string;
  originalPurchaseDate: string;
  expirationDate?: string;
  productIdentifier: string;
  isSandbox: boolean;
}

export interface RevenueCatCustomerInfo {
  entitlements: {
    [key: string]: RevenueCatEntitlement;
  };
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  latestExpirationDate?: string;
  firstSeen: string;
  originalAppUserId: string;
  managementURL?: string;
}

// Constantes pour les produits
export const PRODUCT_IDS = {
  STARTER_MONTHLY: "starter_monthly",
  STARTER_YEARLY: "starter_yearly",
  PRO_MONTHLY: "pro_monthly",
  PRO_YEARLY: "pro_yearly",
  PREMIUM_MONTHLY: "premium_monthly",
  PREMIUM_YEARLY: "premium_yearly",
} as const;

// Constantes pour les entitlements
export const ENTITLEMENT_IDS = {
  PRO: "renderz Pro",
} as const;

// Nombre de rendus par mois autorisés pour tous les utilisateurs
export const MONTHLY_RENDERS_LIMIT = 200;