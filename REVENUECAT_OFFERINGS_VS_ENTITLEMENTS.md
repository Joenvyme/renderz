# 📦 RevenueCat : Offerings vs Entitlements - Différence Importante

## ❌ Problème Actuel

Vous avez créé vos produits et les avez liés à un **entitlement**, mais **pas à un Offering**.

**Résultat** : Les produits ne sont pas accessibles via le SDK → "Aucune offre disponible"

---

## 🔍 Différence entre Offerings et Entitlements

### Entitlements (Droits d'Accès)

**Rôle** : Définir les **droits** que l'utilisateur a (ex: `renderz Pro`)

**Exemple** :
- Entitlement `renderz Pro` = L'utilisateur a accès aux fonctionnalités PRO

**Utilisation** :
- Vérifier si l'utilisateur a accès : `customerInfo.entitlements["renderz Pro"].isActive`
- Définir les fonctionnalités disponibles selon l'abonnement

### Offerings (Offres Disponibles)

**Rôle** : Contenir les **produits disponibles à l'achat**

**Exemple** :
- Offering "default" contient les packages (starter_monthly, pro_monthly, etc.)

**Utilisation** :
- Le SDK récupère les produits depuis les Offerings
- C'est ce que vous affichez dans votre paywall

---

## ✅ Structure Correcte

```
RevenueCat
├── Products (Stripe)
│   ├── starter_monthly
│   ├── starter_yearly
│   ├── pro_monthly
│   ├── pro_yearly
│   ├── premium_monthly
│   └── premium_yearly
│
├── Entitlements
│   └── renderz Pro
│       └── Lié à TOUS les produits payants
│
└── Offerings
    └── default (ou current)
        └── Packages (référencent les produits)
            ├── Package "starter_monthly" → Product: starter_monthly
            ├── Package "starter_yearly" → Product: starter_yearly
            ├── Package "pro_monthly" → Product: pro_monthly
            ├── Package "pro_yearly" → Product: pro_yearly
            ├── Package "premium_monthly" → Product: premium_monthly
            └── Package "premium_yearly" → Product: premium_yearly
```

---

## 🔧 Comment Corriger

### Étape 1 : Créer un Offering

1. **RevenueCat Dashboard** → **Offerings**
2. Cliquez sur **Create Offering** (ou **+ New Offering**)
3. **Nom** : `default` (ou `current`)
4. **Description** : "Offering par défaut pour Renderz"
5. Cliquez sur **Save**

### Étape 2 : Ajouter les Packages à l'Offering

Une fois l'Offering créé :

1. **Ouvrez l'Offering "default"**
2. Cliquez sur **Add Package** (ou **+ Package**)

3. **Pour chaque produit, créez un package** :

   **Package 1 : STARTER Monthly**
   - **Package Identifier** : `starter_monthly`
   - **Product** : Sélectionnez `starter_monthly` (depuis la liste des produits Stripe)
   - Cliquez sur **Save**

   **Package 2 : STARTER Yearly**
   - **Package Identifier** : `starter_yearly`
   - **Product** : Sélectionnez `starter_yearly`
   - Cliquez sur **Save**

   **Package 3 : PRO Monthly**
   - **Package Identifier** : `pro_monthly`
   - **Product** : Sélectionnez `pro_monthly`
   - Cliquez sur **Save**

   **Package 4 : PRO Yearly**
   - **Package Identifier** : `pro_yearly`
   - **Product** : Sélectionnez `pro_yearly`
   - Cliquez sur **Save**

   **Package 5 : PREMIUM Monthly**
   - **Package Identifier** : `premium_monthly`
   - **Product** : Sélectionnez `premium_monthly`
   - Cliquez sur **Save**

   **Package 6 : PREMIUM Yearly**
   - **Package Identifier** : `premium_yearly`
   - **Product** : Sélectionnez `premium_yearly`
   - Cliquez sur **Save**

### Étape 3 : Vérifier que l'Offering est "Current"

1. Dans la liste des Offerings, vérifiez que "default" est marqué comme **"Current"** ou **"Default"**
2. Si non, cliquez sur **Set as Current** ou **Make Default**

---

## 📊 Résumé : Ce qui est Correct vs Incorrect

### ✅ Correct

```
Products → Liés à Entitlement "renderz Pro"
         → Ajoutés à Offering "default" via Packages
```

### ❌ Incorrect (Votre Cas Actuel)

```
Products → Liés à Entitlement "renderz Pro"
         → PAS dans un Offering
```

**Résultat** : Les produits existent mais ne sont pas accessibles via `getOfferings()`

---

## 🎯 Pourquoi les Deux Sont Nécessaires

### Entitlements
- **Définissent les droits** : "L'utilisateur a-t-il accès à renderz Pro ?"
- **Vérifiés après l'achat** : `customerInfo.entitlements["renderz Pro"].isActive`

### Offerings
- **Contiennent les produits à vendre** : "Quels produits sont disponibles ?"
- **Récupérés par le SDK** : `purchases.getOfferings().current.availablePackages`

**Les deux sont nécessaires** :
- **Offering** = Ce que vous vendez (paywall)
- **Entitlement** = Ce que l'utilisateur a (droits d'accès)

---

## ✅ Checklist Finale

- [ ] **Produits créés** dans RevenueCat/Stripe (6 produits)
- [ ] **Entitlement "renderz Pro" créé**
- [ ] **Produits liés à l'entitlement "renderz Pro"**
- [ ] **Offering "default" créé**
- [ ] **Packages ajoutés à l'Offering** (6 packages)
- [ ] **Packages liés aux produits Stripe**
- [ ] **Offering "default" marqué comme "Current"**

---

## 🔍 Vérification

Après avoir créé l'Offering et ajouté les packages :

1. **Rechargez votre application**
2. **Ouvrez la console** (F12)
3. **Cherchez** :
   ```
   ✅ Current offering found: {
     identifier: "default",
     packagesCount: 6,  ← Doit être 6
     packages: [...]
   }
   ✅ RevenueCat products loaded: 6 ['starter_monthly', 'starter_yearly', ...]
   ```

Si vous voyez `packagesCount: 0` ou `products loaded: 0`, les packages ne sont pas correctement liés aux produits.

---

## 💡 Astuce

**Ordre de configuration recommandé** :

1. ✅ Créer les produits dans Stripe
2. ✅ Connecter Stripe à RevenueCat
3. ✅ Synchroniser les produits
4. ✅ Créer l'entitlement "renderz Pro"
5. ✅ Lier les produits à l'entitlement
6. ✅ **Créer l'Offering "default"**
7. ✅ **Ajouter les packages à l'Offering**
8. ✅ **Lier les packages aux produits**

---

**Une fois l'Offering configuré avec les packages, les produits devraient se charger automatiquement !** 🚀

