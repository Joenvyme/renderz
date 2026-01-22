# 📅 Créer des Produits Annuels dans RevenueCat/Stripe

## ❓ Problème : Seulement les Produits Mensuels Visibles

Si vous ne voyez que les produits mensuels dans l'Offering, c'est probablement parce que les produits annuels ne sont pas correctement configurés dans Stripe.

---

## 🔍 Vérification dans Stripe

### Les Produits Annuels Doivent Être des Abonnements Annuels

Dans Stripe, les produits annuels doivent être configurés comme des **abonnements récurrents avec facturation annuelle**.

### Comment Vérifier dans Stripe

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com/)
2. Allez dans **Products**
3. Vérifiez vos produits

**Pour un produit annuel, vous devriez voir** :
- **Type** : Subscription (Recurring)
- **Billing Period** : Yearly (ou "Every 12 months")
- **Price** : €X.XX / year

**Si vous voyez** :
- **Billing Period** : Monthly
- **Price** : €X.XX / month

→ C'est un produit mensuel, pas annuel !

---

## ✅ Créer un Produit Annuel dans Stripe

### Option 1 : Créer un Nouveau Produit Annuel

1. **Stripe Dashboard** → **Products** → **Add Product**

2. **Informations du Produit** :
   - **Name** : `Starter Yearly` (ou `starter_yearly`)
   - **Description** : Plan STARTER - Abonnement annuel

3. **Pricing** :
   - **Pricing model** : **Standard pricing**
   - **Price** : `99.00`
   - **Currency** : EUR
   - **Billing period** : **Yearly** (ou "Every 12 months") ← **IMPORTANT**
   - **Recurring** : ✅ Oui

4. Cliquez sur **Save product**

### Option 2 : Vérifier les Produits Existants

Si vous avez déjà créé des produits :

1. Ouvrez chaque produit dans Stripe
2. Vérifiez la section **Pricing**
3. **Billing period** doit être **"Yearly"** ou **"Every 12 months"**

Si c'est "Monthly", vous devez créer un nouveau produit pour l'annuel.

---

## 🔄 Synchroniser avec RevenueCat

Après avoir créé les produits annuels dans Stripe :

1. **RevenueCat Dashboard** → **Integrations** → **Stripe**
2. Cliquez sur **Sync Products** ou **Refresh**
3. Attendez que la synchronisation se termine
4. Vérifiez que les produits annuels apparaissent dans RevenueCat

---

## 📦 Ajouter les Produits Annuels à l'Offering

Une fois les produits annuels synchronisés :

1. **RevenueCat Dashboard** → **Offerings** → **default**
2. Cliquez sur **Add Package**
3. **Package Identifier** : `starter_yearly`
4. **Product** : Sélectionnez `starter_yearly` (devrait maintenant apparaître dans la liste)
5. Cliquez sur **Save**

Répétez pour tous les produits annuels.

---

## 🔍 Vérification

### Dans Stripe

Vérifiez que vous avez **6 produits** :

**Mensuels** :
- `starter_monthly` - €9.90 / month
- `pro_monthly` - €29.90 / month
- `premium_monthly` - €99.90 / month

**Annuels** :
- `starter_yearly` - €99.00 / year ← **Billing period: Yearly**
- `pro_yearly` - €299.00 / year ← **Billing period: Yearly**
- `premium_yearly` - €999.00 / year ← **Billing period: Yearly**

### Dans RevenueCat

1. **Products** → Vérifiez que les 6 produits apparaissent
2. **Offerings** → **default** → Vérifiez que les 6 packages sont ajoutés

---

## ⚠️ Problèmes Courants

### Problème 1 : Produit Annuel Créé comme Mensuel

**Symptôme** : Le produit existe mais avec facturation mensuelle

**Solution** : Créez un nouveau produit avec `Billing period: Yearly`

### Problème 2 : Produits Non Synchronisés

**Symptôme** : Les produits annuels existent dans Stripe mais pas dans RevenueCat

**Solution** :
1. RevenueCat → **Integrations** → **Stripe**
2. Cliquez sur **Sync Products**
3. Attendez la synchronisation

### Problème 3 : Produits Visibles mais Pas dans l'Offering

**Symptôme** : Les produits apparaissent dans RevenueCat mais pas dans la liste lors de l'ajout d'un package

**Solution** :
1. Vérifiez que les produits sont bien synchronisés
2. Rafraîchissez la page RevenueCat
3. Essayez de créer le package à nouveau

---

## 📝 Checklist Complète

### Dans Stripe

- [ ] **6 produits créés** (3 mensuels + 3 annuels)
- [ ] **Produits mensuels** : Billing period = Monthly
- [ ] **Produits annuels** : Billing period = Yearly
- [ ] **Prix configurés** correctement

### Dans RevenueCat

- [ ] **Stripe connecté** et synchronisé
- [ ] **6 produits visibles** dans RevenueCat → Products
- [ ] **Offering "default" créé**
- [ ] **6 packages ajoutés** à l'Offering
- [ ] **Packages liés** aux bons produits (mensuels et annuels)

---

## 💡 Astuce : Structure Recommandée dans Stripe

### Produits Mensuels

```
Product: starter_monthly
  Type: Subscription
  Billing: Monthly
  Price: €9.90 / month

Product: pro_monthly
  Type: Subscription
  Billing: Monthly
  Price: €29.90 / month

Product: premium_monthly
  Type: Subscription
  Billing: Monthly
  Price: €99.90 / month
```

### Produits Annuels

```
Product: starter_yearly
  Type: Subscription
  Billing: Yearly ← IMPORTANT
  Price: €99.00 / year

Product: pro_yearly
  Type: Subscription
  Billing: Yearly ← IMPORTANT
  Price: €299.00 / year

Product: premium_yearly
  Type: Subscription
  Billing: Yearly ← IMPORTANT
  Price: €999.00 / year
```

---

## 🔗 Liens Utiles

- [Stripe Dashboard - Products](https://dashboard.stripe.com/products)
- [Stripe Documentation - Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [RevenueCat Stripe Integration](https://www.revenuecat.com/docs/stripe)

---

**Une fois les produits annuels correctement configurés dans Stripe avec "Billing period: Yearly", ils devraient apparaître dans RevenueCat et pouvoir être ajoutés à l'Offering !** 🚀

