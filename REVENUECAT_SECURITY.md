# 🔐 Sécurité RevenueCat - Guide Complet

## ⚠️ Risques et Bonnes Pratiques

### Types de clés RevenueCat

RevenueCat utilise **deux types de clés** avec des permissions différentes :

#### 1. Clé PUBLIQUE (SDK API Key)
- **Format** : `rcw_...` (production) ou `test_...` (test)
- **Usage** : Côté client (browser) ✅
- **Permissions** :
  - ✅ Lire les entitlements d'un utilisateur
  - ✅ Vérifier le statut d'abonnement
  - ✅ Initialiser le SDK
  - ❌ Modifier des abonnements
  - ❌ Accorder des droits payés
  - ❌ Supprimer des entitlements

#### 2. Clé SECRÈTE (Secret API Key)
- **Format** : `sk_...`
- **Usage** : UNIQUEMENT côté serveur ❌
- **Permissions** :
  - ✅ Toutes les opérations de la clé publique
  - ✅ Modifier des entitlements
  - ✅ Gracier des abonnements
  - ✅ Créer des utilisateurs
  - ✅ Accorder des droits payés

## 🛡️ Sécurité dans Next.js

### ✅ Ce qui est SÉCURISÉ dans notre implémentation

1. **Clé publique côté client** :
   ```typescript
   // lib/revenuecat.ts (côté client)
   const REVENUECAT_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY;
   ```
   ✅ C'est normal et sécurisé - la clé publique est conçue pour être exposée

2. **Vérification côté serveur** :
   ```typescript
   // app/api/revenuecat/check/route.ts (côté serveur)
   // Vérifie les entitlements avec authentification Better Auth
   ```
   ✅ Les vérifications critiques se font côté serveur avec authentification

3. **ID utilisateur sécurisé** :
   ```typescript
   // Utilise l'ID Better Auth (UUID) comme appUserID
   await purchases.identify(session.user.id);
   ```
   ✅ L'ID utilisateur n'est pas prévisible (UUID)

### ⚠️ Points d'attention

1. **Exposition de la clé publique** :
   - La clé publique est visible dans le code JavaScript du navigateur
   - C'est **normal** pour RevenueCat Web SDK
   - Un attaquant peut voir la clé, mais ne peut pas :
     - Accorder des droits payés
     - Modifier des abonnements
     - Accéder aux données d'autres utilisateurs (sans connaître leur ID)

2. **Protection par appUserID** :
   - Les entitlements sont liés à un `appUserID` (ID Better Auth)
   - Un attaquant ne peut pas deviner les IDs des autres utilisateurs
   - ✅ Utilisation d'UUID non prévisibles

3. **Vérifications côté serveur** :
   - Les limites de rendus sont vérifiées côté serveur
   - Les vérifications d'entitlements se font côté serveur
   - ✅ Double vérification : client + serveur

## 🔒 Recommandations de Sécurité

### 1. Utiliser des clés différentes par environnement

```env
# Développement
NEXT_PUBLIC_REVENUECAT_API_KEY=test_...

# Production
NEXT_PUBLIC_REVENUECAT_API_KEY=rcw_...
```

### 2. Ne jamais exposer la clé secrète

```env
# ❌ JAMAIS dans NEXT_PUBLIC_*
# ✅ UNIQUEMENT dans les variables serveur
REVENUECAT_SECRET_KEY=sk_...
```

### 3. Vérifier les permissions de la clé

Dans RevenueCat Dashboard :
- Vérifiez que la clé utilisée est bien une **clé publique SDK**
- Ne partagez jamais la clé secrète
- Utilisez des clés différentes pour dev/staging/prod

### 4. Monitoring et alertes

- Surveillez les tentatives d'utilisation anormales
- Configurez des alertes dans RevenueCat Dashboard
- Loggez les erreurs d'authentification

## 🚨 Que faire si la clé est compromise ?

### Si la clé PUBLIQUE est compromise :
1. ✅ Pas de panique - elle ne permet pas de modifier des abonnements
2. ⚠️ Surveillez les logs RevenueCat pour des activités suspectes
3. 🔄 Régénérez la clé dans RevenueCat Dashboard si nécessaire

### Si la clé SECRÈTE est compromise :
1. 🚨 **URGENT** - Régénérez immédiatement la clé dans RevenueCat Dashboard
2. 🔄 Mettez à jour toutes les variables d'environnement
3. 📊 Vérifiez les logs pour des modifications non autorisées
4. 🔐 Changez les mots de passe des comptes administrateurs

## 📊 Vérification de Sécurité

### Checklist

- [ ] La clé utilisée est bien une clé **publique SDK** (commence par `rcw_` ou `test_`)
- [ ] La clé secrète (si utilisée) n'est **jamais** dans `NEXT_PUBLIC_*`
- [ ] Les `appUserID` sont des UUID non prévisibles
- [ ] Les vérifications critiques se font côté serveur
- [ ] Des clés différentes sont utilisées pour dev/staging/prod
- [ ] Les logs sont surveillés pour des activités suspectes

## 📚 Documentation RevenueCat

- [RevenueCat Authentication](https://www.revenuecat.com/docs/projects/authentication)
- [RevenueCat Security Best Practices](https://www.revenuecat.com/docs/security)
- [RevenueCat Web SDK](https://www.revenuecat.com/docs/getting-started/installation/web-sdk)

## ✅ Conclusion

**Notre implémentation est sécurisée** car :
1. ✅ On utilise la clé publique (conçue pour être exposée)
2. ✅ Les vérifications critiques se font côté serveur
3. ✅ Les IDs utilisateurs sont non prévisibles (UUID)
4. ✅ Double vérification : client + serveur

**Risques résiduels** :
- ⚠️ Exposition de la clé publique (normal et acceptable)
- ⚠️ Un attaquant peut voir les entitlements d'un utilisateur s'il connaît son ID (mais les IDs sont non prévisibles)


