# 🔧 Dépannage RevenueCat - "Aucune offre disponible"

## ❌ Erreur : "Aucune offre disponible. Vérifiez votre configuration RevenueCat."

Cette erreur signifie que RevenueCat ne trouve pas d'offres (Offerings) configurées. Voici comment résoudre le problème.

---

## 🔍 Causes Possibles

### 1. **Offering Non Créé ou Non Configuré**

**Problème** : Aucun Offering "default" ou "current" n'existe dans RevenueCat.

**Solution** :
1. Allez sur [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Sélectionnez votre projet
3. Allez dans **Offerings**
4. Créez un Offering nommé **"default"** ou **"current"**
5. Ajoutez les packages (starter_monthly, pro_monthly, etc.)

### 2. **Packages Vides dans l'Offering**

**Problème** : L'Offering existe mais ne contient aucun package.

**Solution** :
1. Ouvrez votre Offering "default"
2. Cliquez sur **Add Package**
3. Ajoutez tous vos packages :
   - `starter_monthly`
   - `starter_yearly`
   - `pro_monthly`
   - `pro_yearly`
   - `premium_monthly`
   - `premium_yearly`

### 3. **Produits Non Liés aux Packages**

**Problème** : Les packages existent mais ne sont pas liés aux produits Stripe.

**Solution** :
1. Vérifiez que chaque package référence un produit Stripe
2. Assurez-vous que les Product IDs correspondent exactement :
   - `starter_monthly` → Produit Stripe `starter_monthly`
   - `pro_monthly` → Produit Stripe `pro_monthly`
   - etc.

### 4. **Produits Stripe Non Configurés**

**Problème** : Les produits n'existent pas dans Stripe ou ne sont pas liés à RevenueCat.

**Solution** :
1. Vérifiez dans **Stripe Dashboard** que les produits existent
2. Vérifiez dans **RevenueCat Dashboard** → **Integrations** → **Stripe** que la connexion est active
3. Synchronisez les produits depuis Stripe vers RevenueCat

### 5. **Clé API Incorrecte**

**Problème** : La clé API utilisée n'est pas correcte ou n'a pas accès aux offres.

**Solution** :
1. Vérifiez que `NEXT_PUBLIC_REVENUECAT_API_KEY` est bien définie dans `.env.local`
2. Vérifiez que vous utilisez la bonne clé (test pour dev, production pour prod)
3. Redémarrez le serveur après modification

---

## ✅ Checklist de Vérification

### Dans RevenueCat Dashboard

- [ ] **Offering "default" ou "current" existe**
  - Allez dans **Offerings**
  - Vérifiez qu'un Offering nommé "default" ou "current" existe
  - Si non, créez-en un

- [ ] **Packages ajoutés à l'Offering**
  - Ouvrez l'Offering "default"
  - Vérifiez qu'il contient au moins un package
  - Ajoutez les 6 packages si manquants

- [ ] **Produits liés aux packages**
  - Vérifiez que chaque package référence un produit
  - Les Product IDs doivent correspondre exactement

- [ ] **Stripe connecté**
  - Allez dans **Integrations** → **Stripe**
  - Vérifiez que Stripe est connecté
  - Synchronisez les produits si nécessaire

### Dans Votre Code

- [ ] **Variable d'environnement définie**
  ```env
  NEXT_PUBLIC_REVENUECAT_API_KEY=test_gCXwdEMumqTGFZxoNVUUROXtjVp
  ```

- [ ] **Serveur redémarré**
  - Après modification de `.env.local`, redémarrez `npm run dev`

- [ ] **Console du navigateur**
  - Ouvrez la console (F12)
  - Vérifiez les logs RevenueCat
  - Cherchez les erreurs ou warnings

---

## 🔧 Étapes de Dépannage Détaillées

### Étape 1 : Vérifier l'Offering

1. **RevenueCat Dashboard** → **Offerings**
2. Vérifiez qu'un Offering nommé **"default"** existe
3. Si non, cliquez sur **Create Offering**
4. Nommez-le **"default"**
5. Cliquez sur **Save**

### Étape 2 : Ajouter les Packages

1. Ouvrez l'Offering "default"
2. Cliquez sur **Add Package**
3. Pour chaque produit, créez un package :
   - **Package Identifier** : `starter_monthly`
   - **Product** : Sélectionnez `starter_monthly` (depuis Stripe)
   - Répétez pour tous les produits

### Étape 3 : Vérifier Stripe

1. **Stripe Dashboard** → **Products**
2. Vérifiez que les 6 produits existent :
   - `starter_monthly`
   - `starter_yearly`
   - `pro_monthly`
   - `pro_yearly`
   - `premium_monthly`
   - `premium_yearly`

### Étape 4 : Synchroniser RevenueCat avec Stripe

1. **RevenueCat Dashboard** → **Integrations** → **Stripe**
2. Cliquez sur **Sync Products** ou **Refresh**
3. Attendez que la synchronisation se termine

### Étape 5 : Vérifier les Logs

1. Ouvrez la console du navigateur (F12)
2. Rechargez la page
3. Cherchez les logs :
   ```
   RevenueCat products loaded: 6 ['starter_monthly', 'starter_yearly', ...]
   ```
4. Si vous voyez "No current offering available", vérifiez l'étape 1

---

## 🐛 Erreur : "Cannot read properties of undefined (reading 'identifier')"

Cette erreur a été corrigée dans le code, mais peut encore apparaître si :

1. **Les produits ne sont pas chargés correctement**
   - Vérifiez que l'Offering contient des packages
   - Vérifiez que les packages sont liés aux produits

2. **Le tableau `products` est vide**
   - Vérifiez la console pour voir combien de produits sont chargés
   - Si 0, suivez les étapes ci-dessus

---

## 📊 Vérification dans la Console

Ouvrez la console du navigateur (F12) et cherchez :

### ✅ Logs Normaux

```
RevenueCat products loaded: 6 ['starter_monthly', 'starter_yearly', 'pro_monthly', ...]
```

### ❌ Logs d'Erreur

```
No current offering available in RevenueCat
Available offerings: []
```

Si vous voyez ce message, l'Offering n'est pas configuré.

---

## 🔗 Liens Utiles

- [RevenueCat Dashboard](https://app.revenuecat.com/)
- [RevenueCat Offerings Documentation](https://www.revenuecat.com/docs/offerings)
- [RevenueCat Stripe Integration](https://www.revenuecat.com/docs/stripe)

---

## 💡 Astuce

**Pour tester rapidement** :
1. Créez un Offering "default" avec au moins un package
2. Ajoutez un seul produit (ex: `pro_monthly`) pour tester
3. Une fois que ça fonctionne, ajoutez les autres produits

---

**Une fois l'Offering configuré, les produits devraient se charger automatiquement !** 🚀

