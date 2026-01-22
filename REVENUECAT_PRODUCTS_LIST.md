# 📦 Liste des Produits à Créer dans RevenueCat

## 🎯 Vue d'Ensemble

Vous avez **3 plans** dans votre application, et vous devriez proposer **chaque plan en mensuel ET annuel** :

1. **STARTER** - €9.90/mois ou €X/an
2. **PRO** - €29.90/mois ou €X/an (recommandé)
3. **PREMIUM** - €99.90/mois ou €X/an

**Total : 6 produits** (3 plans × 2 périodes)

---

## 📋 Produits à Créer dans RevenueCat Dashboard

### Structure Recommandée : 6 Produits (Tous les Plans en Mensuel + Annuel)

Créez **6 produits** pour offrir le maximum de choix à vos utilisateurs :

#### Plan STARTER

##### 1. **STARTER - Mensuel**
- **Product ID** : `starter_monthly`
- **Type** : Subscription (Recurring)
- **Billing Period** : Monthly
- **Price** : €9.90
- **Currency** : EUR
- **Description** : Plan STARTER - 10 rendus standard/mois

##### 2. **STARTER - Annuel**
- **Product ID** : `starter_yearly`
- **Type** : Subscription (Recurring)
- **Billing Period** : Yearly
- **Price** : €99.00 (€9.90 × 10 mois = économie de 2 mois)
- **Currency** : EUR
- **Description** : Plan STARTER - 10 rendus standard/mois (abonnement annuel)

#### Plan PRO

##### 3. **PRO - Mensuel**
- **Product ID** : `pro_monthly`
- **Type** : Subscription (Recurring)
- **Billing Period** : Monthly
- **Price** : €29.90
- **Currency** : EUR
- **Description** : Plan PRO - 50 rendus standard/mois + 10 upscales 4K

##### 4. **PRO - Annuel**
- **Product ID** : `pro_yearly`
- **Type** : Subscription (Recurring)
- **Billing Period** : Yearly
- **Price** : €299.00 (€29.90 × 10 mois = économie de 2 mois)
- **Currency** : EUR
- **Description** : Plan PRO - 50 rendus standard/mois + 10 upscales 4K (abonnement annuel)

#### Plan PREMIUM

##### 5. **PREMIUM - Mensuel**
- **Product ID** : `premium_monthly`
- **Type** : Subscription (Recurring)
- **Billing Period** : Monthly
- **Price** : €99.90
- **Currency** : EUR
- **Description** : Plan PREMIUM - 200 rendus standard/mois + 50 upscales 4K + 5 upscales 10K

##### 6. **PREMIUM - Annuel**
- **Product ID** : `premium_yearly`
- **Type** : Subscription (Recurring)
- **Billing Period** : Yearly
- **Price** : €999.00 (€99.90 × 10 mois = économie de 2 mois)
- **Currency** : EUR
- **Description** : Plan PREMIUM - 200 rendus standard/mois + 50 upscales 4K + 5 upscales 10K (abonnement annuel)

---

---

## 💰 Calcul des Prix Annuels

Pour calculer les prix annuels avec une économie de 2 mois :

- **STARTER** : €9.90/mois × 10 = **€99.00/an** (économisez €19.80)
- **PRO** : €29.90/mois × 10 = **€299.00/an** (économisez €59.80)
- **PREMIUM** : €99.90/mois × 10 = **€999.00/an** (économisez €199.80)

**Alternative** : Vous pouvez aussi proposer une économie de 1 mois (× 11) ou 3 mois (× 9) selon votre stratégie.

---

## ⚠️ Recommandation

**Je recommande cette structure (6 produits)** car :
- ✅ **Maximum de choix** pour vos utilisateurs
- ✅ **Meilleure conversion** (certains préfèrent l'annuel, d'autres le mensuel)
- ✅ **Économie claire** pour les abonnements annuels
- ✅ **Flexibilité** pour ajuster les prix indépendamment
- ✅ **Meilleure traçabilité** des revenus par plan et période

---

## 🔐 Entitlement à Créer

### **renderz_pro**
- **Entitlement ID** : `renderz_pro`
- **Description** : Accès aux fonctionnalités PRO (rendus illimités, upscale 4K)
- **Produits associés** : 
  - `pro_monthly` (Option 1)
  - `premium_yearly` (Option 1)
  - OU `monthly` et `yearly` (Option 2)

**Tous les produits payants** doivent être associés à cet entitlement.

---

## 📦 Packages à Créer dans l'Offering

Créez un **Offering** (par exemple "default") avec les packages suivants :

### Structure Recommandée (6 Packages)

1. **Package "Starter Monthly"**
   - Product : `starter_monthly`
   - Identifier : `starter_monthly`

2. **Package "Starter Yearly"**
   - Product : `starter_yearly`
   - Identifier : `starter_yearly`

3. **Package "Pro Monthly"**
   - Product : `pro_monthly`
   - Identifier : `pro_monthly`

4. **Package "Pro Yearly"**
   - Product : `pro_yearly`
   - Identifier : `pro_yearly`

5. **Package "Premium Monthly"**
   - Product : `premium_monthly`
   - Identifier : `premium_monthly`

6. **Package "Premium Yearly"**
   - Product : `premium_yearly`
   - Identifier : `premium_yearly`

---

## 🔧 Configuration dans Votre Code

Modifiez `lib/revenuecat.ts` pour supporter les 6 produits :

```typescript
export const PRODUCT_IDS = {
  STARTER_MONTHLY: "starter_monthly",
  STARTER_YEARLY: "starter_yearly",
  PRO_MONTHLY: "pro_monthly",
  PRO_YEARLY: "pro_yearly",
  PREMIUM_MONTHLY: "premium_monthly",
  PREMIUM_YEARLY: "premium_yearly",
} as const;
```

Et dans `components/paywall.tsx`, cherchez les produits spécifiques :

```typescript
// STARTER
const starterMonthly = products.find((p) => p.identifier === PRODUCT_IDS.STARTER_MONTHLY);
const starterYearly = products.find((p) => p.identifier === PRODUCT_IDS.STARTER_YEARLY);

// PRO
const proMonthly = products.find((p) => p.identifier === PRODUCT_IDS.PRO_MONTHLY);
const proYearly = products.find((p) => p.identifier === PRODUCT_IDS.PRO_YEARLY);

// PREMIUM
const premiumMonthly = products.find((p) => p.identifier === PRODUCT_IDS.PREMIUM_MONTHLY);
const premiumYearly = products.find((p) => p.identifier === PRODUCT_IDS.PREMIUM_YEARLY);
```

**Note** : Vous devrez aussi modifier le paywall pour afficher les options mensuel/annuel pour chaque plan.

---

## 📝 Checklist de Configuration

### Dans RevenueCat Dashboard :

- [ ] **Connecter Stripe** (si pas déjà fait)
  - Allez dans **Integrations** → **Stripe**
  - Connectez votre compte Stripe

- [ ] **Créer les Produits** (6 produits au total)
  - [ ] `starter_monthly` (€9.90/mois)
  - [ ] `starter_yearly` (€99.00/an)
  - [ ] `pro_monthly` (€29.90/mois)
  - [ ] `pro_yearly` (€299.00/an)
  - [ ] `premium_monthly` (€99.90/mois)
  - [ ] `premium_yearly` (€999.00/an)

- [ ] **Créer l'Entitlement**
  - [ ] `renderz_pro`
  - [ ] Associer tous les produits payants à cet entitlement

- [ ] **Créer un Offering**
  - [ ] Offering "default" ou "current"
  - [ ] Ajouter les packages correspondants

- [ ] **Configurer les Prix dans Stripe**
  - Les prix doivent correspondre exactement à ceux dans RevenueCat

---

## 💡 Notes Importantes

1. **Identifiants de Produits** :
   - Les Product IDs doivent être **exactement** les mêmes dans RevenueCat et dans votre code
   - Sensible à la casse (minuscules recommandées)
   - Pas d'espaces, utilisez des underscores

2. **Prix** :
   - Configurez les prix dans **Stripe** d'abord
   - Puis liez-les dans RevenueCat
   - Les prix doivent correspondre exactement

3. **Offering** :
   - Créez au moins un Offering "default"
   - Assurez-vous qu'il contient au moins un Package
   - C'est l'Offering qui sera récupéré par `getOfferings().current`

4. **Entitlement** :
   - Tous les produits payants doivent donner accès à `renderz_pro`
   - C'est cet entitlement que vous vérifiez dans votre code avec `isPro`

---

## 🚀 Prochaines Étapes

1. **Choisissez votre option** (Option 1 ou Option 2)
2. **Créez les produits** dans RevenueCat Dashboard
3. **Créez l'entitlement** `renderz_pro`
4. **Créez l'Offering** avec les packages
5. **Testez** avec des produits de test Stripe

---

## 📚 Ressources

- [RevenueCat Products Documentation](https://www.revenuecat.com/docs/entitlements)
- [RevenueCat Offerings Documentation](https://www.revenuecat.com/docs/offerings)
- [Stripe Products Setup](https://stripe.com/docs/billing/subscriptions/overview)

---

**Une fois les produits créés, votre paywall devrait automatiquement les charger et les afficher !** 🎉

