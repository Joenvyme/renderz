import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { Purchases } from '@revenuecat/purchases-js';

// ⚠️ SÉCURITÉ: Utilisez la clé PUBLIQUE côté serveur aussi (pour les vérifications)
// Pour des opérations plus sensibles, utilisez REVENUECAT_SECRET_KEY (préfixée "sk_")
const REVENUECAT_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY || process.env.REVENUECAT_SECRET_KEY || "test_gCXwdEMumqTGFZxoNVUUROXtjVp";

/**
 * API route pour synchroniser RevenueCat avec Better Auth
 * Cette route identifie l'utilisateur RevenueCat avec son ID Better Auth
 */
export async function POST(request: NextRequest) {
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

    // Initialiser RevenueCat avec l'ID utilisateur Better Auth
    const purchases = Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserId: session.user.id, // Identifier l'utilisateur lors de la configuration
    });

    // Récupérer les infos client mises à jour
    const customerInfo = await purchases.getCustomerInfo();

    // Utiliser une assertion de type pour accéder aux propriétés qui peuvent ne pas être dans le type strict
    const customerInfoAny = customerInfo as any;

    return NextResponse.json({
      success: true,
      userId: session.user.id,
      customerInfo: {
        entitlements: customerInfo.entitlements,
        activeSubscriptions: customerInfo.activeSubscriptions,
        allPurchasedProductIdentifiers: customerInfoAny.allPurchasedProductIdentifiers || [],
      },
    });
  } catch (error) {
    console.error('RevenueCat sync error:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la synchronisation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

