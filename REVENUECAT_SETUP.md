# 🎯 Configuration RevenueCat pour Renderz

## 📋 Vue d'ensemble

RevenueCat est intégré pour gérer les abonnements et les limites de rendus. L'application permet :
- **5 rendus gratuits** pour tous les utilisateurs connectés
- **Abonnements PRO** pour accéder à plus de rendus et à l'upscale 4K
- **Gestion des abonnements** via le Customer Center

## 🔑 Configuration

### 1. Variables d'environnement

Ajoutez vos clés API RevenueCat dans `.env.local` :

```env
# Clé PUBLIQUE (SDK API Key) - Exposée côté client (c'est normal et sécurisé)
# Format: commence par "rcw_" (production) ou "test_" (test)
NEXT_PUBLIC_REVENUECAT_API_KEY=test_gCXwdEMumqTGFZxoNVUUROXtjVp

# Clé SECRÈTE (Secret API Key) - UNIQUEMENT côté serveur (optionnel, pour opérations sensibles)
# Format: commence par "sk_"
# REVENUECAT_SECRET_KEY=sk_...
```

**⚠️ IMPORTANT - Sécurité des clés :**

- **Clé PUBLIQUE** (`NEXT_PUBLIC_REVENUECAT_API_KEY`) :
  - ✅ Peut être exposée côté client (c'est fait pour ça)
  - ✅ Utilisée pour initialiser le SDK et vérifier les entitlements
  - ✅ Ne permet PAS de modifier des abonnements ou d'accorder des droits
  - ⚠️ Format : commence par `rcw_` (production) ou `test_` (test)

- **Clé SECRÈTE** (`REVENUECAT_SECRET_KEY`) :
  - ❌ NE DOIT JAMAIS être exposée côté client
  - ✅ Utilisée uniquement côté serveur pour des opérations sensibles
  - ✅ Permet de modifier des entitlements, gracier des abonnements, etc.
  - ⚠️ Format : commence par `sk_`

**Note** : Pour la plupart des cas d'usage, la clé publique suffit. La clé secrète n'est nécessaire que pour des opérations administratives côté serveur.

### 2. Configuration RevenueCat Dashboard

1. Allez sur https://app.revenuecat.com/
2. Créez un projet ou sélectionnez votre projet existant
3. Configurez vos produits :
   - **monthly** : Abonnement mensuel
   - **yearly** : Abonnement annuel
4. Créez un entitlement **renderz_pro** qui donne accès aux fonctionnalités PRO
5. Associez les produits à l'entitlement **renderz_pro**

## 📦 Produits configurés

### Plan STARTER
- **Produit** : `monthly` (ou créer un produit spécifique `starter_monthly`)
- **Prix** : €9.90/mois
- **Inclus** : 10 rendus standard/mois

### Plan PRO
- **Produit** : `monthly` (ou créer un produit spécifique `pro_monthly`)
- **Prix** : €29.90/mois
- **Inclus** : 50 rendus standard/mois + 10 upscales 4K

### Plan PREMIUM
- **Produit** : `yearly` (ou créer un produit spécifique `premium_yearly`)
- **Prix** : €99.90/mois
- **Inclus** : 200 rendus standard/mois + 50 upscales 4K + 5 upscales 10K

## 🔐 Entitlements

### renderz_pro
- **Identifiant** : `renderz_pro`
- **Description** : Accès aux fonctionnalités PRO (rendus illimités, upscale 4K)
- **Produits associés** : monthly, yearly

## 🎨 Intégration dans l'application

### Hook useRevenueCat

Le hook `useRevenueCat` est disponible dans toute l'application :

```typescript
import { useRevenueCat } from "@/lib/hooks/use-revenuecat";

const { isPro, isLoading, customerInfo, purchaseProduct, presentPaywall } = useRevenueCat();
```

### Composants

#### Paywall
```typescript
import { Paywall } from "@/components/paywall";

<Paywall
  isOpen={showPaywall}
  onClose={() => setShowPaywall(false)}
  onSuccess={() => {
    // Recharger la page pour mettre à jour les entitlements
    window.location.reload();
  }}
/>
```

#### Customer Center
```typescript
import { CustomerCenter } from "@/components/customer-center";

<CustomerCenter
  isOpen={showCustomerCenter}
  onClose={() => setShowCustomerCenter(false)}
/>
```

## 🔄 Synchronisation avec Better Auth

L'application synchronise automatiquement RevenueCat avec Better Auth :
- L'ID utilisateur Better Auth est utilisé comme identifiant RevenueCat
- La synchronisation se fait automatiquement lors de la connexion
- Route API : `/api/revenuecat/sync`

## 🚫 Limites et restrictions

### Rendu gratuit
- **5 rendus gratuits** pour tous les utilisateurs connectés
- Vérifié dans `/api/generate` route

### Upscale 4K
- **Réservé aux abonnés PRO**
- Vérifié dans `/api/upscale` route
- Affiche le paywall si l'utilisateur n'est pas PRO

## 📊 Vérification des entitlements

### Côté client
```typescript
const { isPro } = useRevenueCat();
if (isPro) {
  // Accès PRO
}
```

### Côté serveur
```typescript
// Dans une API route
const revenueCatRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revenuecat/check`, {
  headers: {
    Cookie: request.headers.get('cookie') || '',
  },
});
const { isPro } = await revenueCatRes.json();
```

## 🧪 Test en développement

1. Utilisez la clé API de test : `test_gCXwdEMumqTGFZxoNVUUROXtjVp`
2. Configurez des produits de test dans RevenueCat Dashboard
3. Testez les achats avec les produits de test
4. Vérifiez que les entitlements sont correctement appliqués

## 🚀 Production

1. Remplacez la clé API de test par la clé de production
2. Configurez les produits réels dans RevenueCat Dashboard
3. Testez les achats avec des comptes de test
4. Surveillez les erreurs dans les logs

## 📚 Documentation

- [RevenueCat Web SDK](https://www.revenuecat.com/docs/getting-started/installation/web-sdk)
- [RevenueCat Entitlements](https://www.revenuecat.com/docs/entitlements)
- [RevenueCat Products](https://www.revenuecat.com/docs/products)

## ✅ Checklist de déploiement

- [ ] Clé API RevenueCat configurée (test puis production)
- [ ] Produits créés dans RevenueCat Dashboard
- [ ] Entitlement `renderz_pro` créé et associé aux produits
- [ ] Test des achats avec des produits de test
- [ ] Vérification que les limites gratuites fonctionnent (5 rendus)
- [ ] Vérification que l'upscale est bloqué pour les non-PRO
- [ ] Test du Customer Center
- [ ] Test de la restauration des achats

