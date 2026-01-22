import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { Purchases } from '@revenuecat/purchases-js';

// ⚠️ SÉCURITÉ: Utilisez la clé PUBLIQUE côté serveur aussi (pour les vérifications)
// Pour des opérations plus sensibles, utilisez REVENUECAT_SECRET_KEY (préfixée "sk_")
// La clé publique peut être utilisée côté serveur pour les vérifications d'entitlements
const REVENUECAT_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY || process.env.REVENUECAT_SECRET_KEY || "test_gCXwdEMumqTGFZxoNVUUROXtjVp";
const ENTITLEMENT_ID = "renderz Pro";

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Initialiser RevenueCat avec l'ID utilisateur
    const purchases = Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserId: session.user.id, // Identifier l'utilisateur lors de la configuration
    });

    // Récupérer les infos client
    const customerInfo = await purchases.getCustomerInfo();

    // Vérifier l'entitlement PRO
    const proEntitlement = customerInfo.entitlements[ENTITLEMENT_ID];
    const isPro = proEntitlement?.isActive === true;

    return NextResponse.json({
      isPro,
      customerInfo: {
        entitlements: customerInfo.entitlements,
        activeSubscriptions: customerInfo.activeSubscriptions,
        allPurchasedProductIdentifiers: customerInfo.allPurchasedProductIdentifiers,
        latestExpirationDate: customerInfo.latestExpirationDate,
      },
    });
  } catch (error) {
    console.error('RevenueCat check error:', error);
    // En cas d'erreur, retourner false pour ne pas bloquer l'utilisateur
    return NextResponse.json({
      isPro: false,
      error: error instanceof Error ? error.message : 'Erreur RevenueCat',
    });
  }
}

