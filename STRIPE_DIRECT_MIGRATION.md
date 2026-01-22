# 💳 Migration vers Stripe Direct

## 🎯 Pourquoi Migrer ?

Pour votre application web uniquement, **Stripe Direct** est effectivement plus simple :

### ✅ Avantages
- **Plus simple** : Un seul service à gérer (pas de RevenueCat + Stripe)
- **Moins cher** : Pas de commission RevenueCat, seulement les frais Stripe (2.9% + 0.30€)
- **Plus de contrôle** : Gestion directe du flux de paiement
- **Configuration plus directe** : Pas d'offerings/packages complexes à gérer

### ⚠️ Inconvénients
- **Plus de code à maintenir** : Webhooks, vérifications d'abonnements, etc.
- **Pas d'analytics intégrées** : À construire vous-même
- **Pas de multi-plateforme** : Si vous développez une app mobile plus tard, il faudra gérer App Store/Google Play séparément

---

## 📋 Ce qui sera Migré

### 1. **Remplacement de RevenueCat SDK**
- ❌ Supprimer `@revenuecat/purchases-js`
- ✅ Installer `stripe` (npm)
- ✅ Créer `lib/stripe.ts` pour la configuration Stripe

### 2. **Nouveau Hook `useStripe`**
- ✅ Remplacer `useRevenueCat` par `useStripe`
- ✅ Gérer les produits Stripe directement
- ✅ Vérifier les abonnements actifs

### 3. **Routes API Stripe**
- ✅ `/api/stripe/checkout` : Créer une session Checkout
- ✅ `/api/stripe/webhook` : Gérer les événements Stripe
- ✅ `/api/stripe/subscription` : Vérifier l'abonnement utilisateur

### 4. **Base de Données**
- ✅ Ajouter une table `subscriptions` dans Supabase :
  ```sql
  CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    status TEXT NOT NULL, -- active, canceled, past_due, etc.
    plan_id TEXT NOT NULL, -- starter_monthly, pro_yearly, etc.
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  ```

### 5. **Paywall Component**
- ✅ Adapter `components/paywall.tsx` pour utiliser Stripe Checkout
- ✅ Rediriger vers Stripe Checkout au lieu de RevenueCat

### 6. **Vérification PRO**
- ✅ Remplacer les vérifications RevenueCat par des vérifications Stripe
- ✅ Vérifier dans la base de données si l'utilisateur a un abonnement actif

---

## 🛠 Étapes de Migration

### Étape 1 : Configuration Stripe
1. Créer un compte Stripe (si pas déjà fait)
2. Créer les produits dans Stripe Dashboard :
   - `starter_monthly` (Prix: X CHF/mois)
   - `starter_yearly` (Prix: Y CHF/an)
   - `pro_monthly` (Prix: X CHF/mois)
   - `pro_yearly` (Prix: Y CHF/an)
   - `premium_monthly` (Prix: X CHF/mois)
   - `premium_yearly` (Prix: Y CHF/an)
3. Obtenir les clés API Stripe :
   - `STRIPE_SECRET_KEY` (sk_test_... ou sk_live_...)
   - `STRIPE_PUBLISHABLE_KEY` (pk_test_... ou pk_live_...)
   - `STRIPE_WEBHOOK_SECRET` (whsec_...)

### Étape 2 : Installation
```bash
npm install stripe
npm uninstall @revenuecat/purchases-js
```

### Étape 3 : Variables d'Environnement
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Étape 4 : Migration du Code
- Créer `lib/stripe.ts`
- Créer `lib/hooks/use-stripe.ts`
- Créer routes API Stripe
- Adapter `components/paywall.tsx`
- Adapter `app/page.tsx` et `app/api/generate/route.ts`

### Étape 5 : Migration de la Base de Données
- Créer la table `subscriptions`
- Migrer les abonnements existants (si vous en avez)

---

## 🔄 Fonctionnalités Conservées

Toutes les fonctionnalités actuelles seront conservées :
- ✅ 5 rendus gratuits pour les utilisateurs non-abonnés
- ✅ Limite PRO pour l'upscale 4K
- ✅ Paywall contextuel (upscale, limite atteinte, etc.)
- ✅ Customer Center pour gérer les abonnements
- ✅ Vérification côté serveur des abonnements

---

## ⏱ Temps Estimé

- **Configuration Stripe** : 15-20 minutes
- **Migration du code** : 30-45 minutes
- **Tests** : 15-20 minutes
- **Total** : ~1h-1h30

---

## 🚀 Prêt à Migrer ?

Si vous voulez que je procède à la migration, dites-moi simplement **"oui, migre vers Stripe"** et je m'occupe de tout !

