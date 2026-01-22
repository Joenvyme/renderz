# 🔧 Résoudre "Aucune offre disponible" - Guide Étape par Étape

## ❌ Problème

Vous voyez le message : **"⚠️ Aucune offre disponible. Vérifiez votre configuration RevenueCat."**

Cela signifie que RevenueCat ne trouve pas d'**Offering** configuré.

---

## ✅ Solution : Créer un Offering dans RevenueCat

### Étape 1 : Accéder aux Offerings

1. Allez sur [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Sélectionnez votre projet **renderz**
3. Dans le menu de gauche, cliquez sur **Offerings**

### Étape 2 : Créer un Offering "default"

1. Cliquez sur **Create Offering** (ou **+ New Offering**)
2. **Nom** : `default` (ou `current`)
3. **Description** : "Offering par défaut pour Renderz"
4. Cliquez sur **Save** ou **Create**

**⚠️ IMPORTANT** : L'Offering doit s'appeler **"default"** ou **"current"** pour être automatiquement détecté par le SDK.

### Étape 3 : Ajouter les Packages

Une fois l'Offering créé, vous devez ajouter les **packages** qui référencent vos produits Stripe.

#### Pour chaque produit, créez un package :

1. Dans l'Offering "default", cliquez sur **Add Package** (ou **+ Package**)

2. **Package 1 : STARTER Monthly**
   - **Package Identifier** : `starter_monthly`
   - **Product** : Sélectionnez `starter_monthly` (depuis Stripe)
   - Cliquez sur **Save**

3. **Package 2 : STARTER Yearly**
   - **Package Identifier** : `starter_yearly`
   - **Product** : Sélectionnez `starter_yearly` (depuis Stripe)
   - Cliquez sur **Save**

4. **Package 3 : PRO Monthly**
   - **Package Identifier** : `pro_monthly`
   - **Product** : Sélectionnez `pro_monthly` (depuis Stripe)
   - Cliquez sur **Save**

5. **Package 4 : PRO Yearly**
   - **Package Identifier** : `pro_yearly`
   - **Product** : Sélectionnez `pro_yearly` (depuis Stripe)
   - Cliquez sur **Save**

6. **Package 5 : PREMIUM Monthly**
   - **Package Identifier** : `premium_monthly`
   - **Product** : Sélectionnez `premium_monthly` (depuis Stripe)
   - Cliquez sur **Save**

7. **Package 6 : PREMIUM Yearly**
   - **Package Identifier** : `premium_yearly`
   - **Product** : Sélectionnez `premium_yearly` (depuis Stripe)
   - Cliquez sur **Save**

### Étape 4 : Vérifier Stripe

Avant d'ajouter les packages, assurez-vous que :

1. **Stripe est connecté** :
   - RevenueCat Dashboard → **Integrations** → **Stripe**
   - Vérifiez que Stripe est connecté (bouton vert "Connected")

2. **Les produits existent dans Stripe** :
   - Allez sur [Stripe Dashboard](https://dashboard.stripe.com/)
   - Vérifiez que les 6 produits existent :
     - `starter_monthly`
     - `starter_yearly`
     - `pro_monthly`
     - `pro_yearly`
     - `premium_monthly`
     - `premium_yearly`

3. **Synchroniser les produits** :
   - Dans RevenueCat → **Integrations** → **Stripe**
   - Cliquez sur **Sync Products** ou **Refresh**
   - Attendez que la synchronisation se termine

---

## 🔍 Vérification dans la Console

Après avoir configuré l'Offering, ouvrez la console du navigateur (F12) et rechargez la page.

### ✅ Logs Normaux (Offering Configuré)

```
🔍 Fetching RevenueCat offerings...
📦 RevenueCat offerings response: {
  hasCurrent: true,
  currentIdentifier: "default",
  allOfferings: ["default"],
  allOfferingsCount: 1
}
✅ Current offering found: {
  identifier: "default",
  packagesCount: 6,
  packages: [
    { identifier: "starter_monthly", productId: "starter_monthly" },
    { identifier: "starter_yearly", productId: "starter_yearly" },
    ...
  ]
}
📦 Processing product: { identifier: "starter_monthly", ... }
✅ RevenueCat products loaded: 6 ['starter_monthly', 'starter_yearly', ...]
```

### ❌ Logs d'Erreur (Offering Non Configuré)

```
🔍 Fetching RevenueCat offerings...
📦 RevenueCat offerings response: {
  hasCurrent: false,
  allOfferings: [],
  allOfferingsCount: 0
}
❌ No current offering available in RevenueCat
💡 Solution: Create an Offering named "default" or "current" in RevenueCat Dashboard
```

---

## 📋 Checklist Complète

### Dans RevenueCat Dashboard

- [ ] **Stripe connecté**
  - Integrations → Stripe → Status: Connected

- [ ] **Produits synchronisés depuis Stripe**
  - Les 6 produits apparaissent dans RevenueCat

- [ ] **Offering "default" créé**
  - Offerings → Offering nommé "default" existe

- [ ] **Packages ajoutés à l'Offering**
  - L'Offering "default" contient 6 packages

- [ ] **Packages liés aux produits Stripe**
  - Chaque package référence le bon produit Stripe

### Dans Votre Code

- [ ] **Variable d'environnement définie**
  ```env
  NEXT_PUBLIC_REVENUECAT_API_KEY=test_gCXwdEMumqTGFZxoNVUUROXtjVp
  ```

- [ ] **Serveur redémarré**
  - Après modification de `.env.local`, redémarrez `npm run dev`

- [ ] **Console du navigateur vérifiée**
  - Ouvrez F12 → Console
  - Cherchez les logs RevenueCat

---

## 🎯 Étapes Rapides (Résumé)

1. **RevenueCat Dashboard** → **Offerings**
2. **Create Offering** → Nom : `default`
3. **Add Package** pour chaque produit (6 packages au total)
4. **Vérifiez Stripe** → Les produits existent et sont synchronisés
5. **Rechargez** votre application
6. **Vérifiez la console** → Les produits devraient se charger

---

## 🐛 Si Ça Ne Fonctionne Toujours Pas

### Vérification 1 : Clé API

Ouvrez la console (F12) et vérifiez qu'il n'y a pas d'erreur d'authentification :
```
RevenueCat error: Invalid API key
```

**Solution** : Vérifiez que `NEXT_PUBLIC_REVENUECAT_API_KEY` est bien définie.

### Vérification 2 : Stripe Non Connecté

Si Stripe n'est pas connecté :
1. RevenueCat Dashboard → **Integrations** → **Stripe**
2. Cliquez sur **Connect Stripe**
3. Suivez les instructions pour connecter votre compte Stripe

### Vérification 3 : Produits Non Synchronisés

Si les produits n'apparaissent pas dans RevenueCat :
1. RevenueCat Dashboard → **Integrations** → **Stripe**
2. Cliquez sur **Sync Products**
3. Attendez la synchronisation

### Vérification 4 : Offering Non Défini comme "Current"

Si l'Offering existe mais n'est pas détecté :
1. Ouvrez l'Offering "default"
2. Vérifiez qu'il est marqué comme **"Current"** ou **"Default"**
3. Si non, cliquez sur **Set as Current** ou **Make Default**

---

## 💡 Astuce : Test Rapide

Pour tester rapidement :

1. **Créez un Offering "default"** avec **un seul package** (ex: `pro_monthly`)
2. **Rechargez** votre application
3. **Vérifiez la console** → Vous devriez voir au moins 1 produit chargé
4. Si ça fonctionne, **ajoutez les autres packages** progressivement

---

## 📞 Besoin d'Aide ?

Si après avoir suivi ces étapes, vous avez toujours le problème :

1. **Ouvrez la console** (F12)
2. **Copiez tous les logs** qui commencent par 🔍, 📦, ✅, ou ❌
3. **Vérifiez dans RevenueCat Dashboard** :
   - Que l'Offering "default" existe
   - Qu'il contient au moins un package
   - Que les packages sont liés aux produits Stripe

---

**Une fois l'Offering configuré, les produits devraient se charger automatiquement !** 🚀

