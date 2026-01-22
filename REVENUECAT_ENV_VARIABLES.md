# 🔑 Variables d'Environnement RevenueCat

## 📋 Liste Complète des Variables

### Variables Requises

```env
# RevenueCat - Clé PUBLIQUE (SDK API Key)
# ⚠️ Format: commence par "rcw_" (production) ou "test_" (test)
# ✅ Peut être exposée côté client (c'est fait pour ça)
NEXT_PUBLIC_REVENUECAT_API_KEY=test_gCXwdEMumqTGFZxoNVUUROXtjVp

# RevenueCat - Clé SECRÈTE (Secret API Key) - OPTIONNEL
# ⚠️ Format: commence par "sk_"
# ❌ NE DOIT JAMAIS être exposée côté client
# ✅ Utilisée uniquement côté serveur pour des opérations sensibles
REVENUECAT_SECRET_KEY=sk_votre_cle_secrete_ici
```

---

## 🔍 Où Trouver Vos Clés

### 1. Clé PUBLIQUE (SDK API Key)

**RevenueCat Dashboard** → **Project Settings** → **API Keys**

#### Clé de TEST
- **Format** : `test_...`
- **Exemple** : `test_gCXwdEMumqTGFZxoNVUUROXtjVp`
- **Usage** : Développement et tests

#### Clé de PRODUCTION
- **Format** : `rcw_...`
- **Exemple** : `rcw_abc123def456ghi789...`
- **Usage** : Production

### 2. Clé SECRÈTE (Secret API Key)

**RevenueCat Dashboard** → **Project Settings** → **API Keys** → **Secret Keys**

- **Format** : `sk_...`
- **Exemple** : `sk_live_abc123def456ghi789...`
- **Usage** : Opérations sensibles côté serveur uniquement

---

## 📝 Configuration Complète

### Pour le Développement (`.env.local`)

```env
# RevenueCat - Clé PUBLIQUE de TEST
NEXT_PUBLIC_REVENUECAT_API_KEY=test_gCXwdEMumqTGFZxoNVUUROXtjVp

# RevenueCat - Clé SECRÈTE de TEST (optionnel)
REVENUECAT_SECRET_KEY=sk_test_votre_cle_secrete_test
```

### Pour la Production (Vercel)

#### Variables d'Environnement à Ajouter dans Vercel :

1. **Production** :
   ```
   NEXT_PUBLIC_REVENUECAT_API_KEY=rcw_votre_cle_production
   REVENUECAT_SECRET_KEY=sk_live_votre_cle_secrete_production
   ```

2. **Preview** (branches) :
   ```
   NEXT_PUBLIC_REVENUECAT_API_KEY=test_gCXwdEMumqTGFZxoNVUUROXtjVp
   REVENUECAT_SECRET_KEY=sk_test_votre_cle_secrete_test
   ```

3. **Development** :
   ```
   NEXT_PUBLIC_REVENUECAT_API_KEY=test_gCXwdEMumqTGFZxoNVUUROXtjVp
   REVENUECAT_SECRET_KEY=sk_test_votre_cle_secrete_test
   ```

---

## ⚠️ Différences entre les Clés

### Clé PUBLIQUE (`NEXT_PUBLIC_REVENUECAT_API_KEY`)

| Aspect | Détails |
|--------|---------|
| **Format** | `test_...` (test) ou `rcw_...` (production) |
| **Exposition** | ✅ Peut être exposée côté client |
| **Usage** | Initialiser le SDK, vérifier les entitlements |
| **Permissions** | Lecture seule (ne peut pas modifier) |
| **Sécurité** | Sécurisée par design pour être publique |

### Clé SECRÈTE (`REVENUECAT_SECRET_KEY`)

| Aspect | Détails |
|--------|---------|
| **Format** | `sk_test_...` (test) ou `sk_live_...` (production) |
| **Exposition** | ❌ JAMAIS côté client |
| **Usage** | Opérations sensibles côté serveur |
| **Permissions** | Lecture + Écriture (peut modifier) |
| **Sécurité** | ⚠️ Très sensible, garder secrète |

---

## 🔧 Utilisation dans le Code

### Clé PUBLIQUE (Côté Client)

```typescript
// lib/revenuecat.ts
const REVENUECAT_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY || "test_gCXwdEMumqTGFZxoNVUUROXtjVp";
```

### Clé SECRÈTE (Côté Serveur)

```typescript
// app/api/revenuecat/check/route.ts
const REVENUECAT_SECRET_KEY = process.env.REVENUECAT_SECRET_KEY || process.env.NEXT_PUBLIC_REVENUECAT_API_KEY;
```

---

## 📍 Où Ajouter les Variables

### 1. Développement Local

**Fichier** : `.env.local` (à la racine du projet)

```env
NEXT_PUBLIC_REVENUECAT_API_KEY=test_gCXwdEMumqTGFZxoNVUUROXtjVp
REVENUECAT_SECRET_KEY=sk_test_votre_cle_secrete
```

### 2. Production (Vercel)

**Vercel Dashboard** → **Votre Projet** → **Settings** → **Environment Variables**

Ajoutez :
- `NEXT_PUBLIC_REVENUECAT_API_KEY` (Production : `rcw_...`, Preview/Dev : `test_...`)
- `REVENUECAT_SECRET_KEY` (Production : `sk_live_...`, Preview/Dev : `sk_test_...`)

---

## ✅ Checklist

- [ ] Clé publique de TEST obtenue depuis RevenueCat Dashboard
- [ ] Clé publique de PRODUCTION obtenue depuis RevenueCat Dashboard
- [ ] Clé secrète de TEST obtenue (optionnel)
- [ ] Clé secrète de PRODUCTION obtenue (optionnel)
- [ ] Variables ajoutées dans `.env.local` (développement)
- [ ] Variables ajoutées dans Vercel (production)
- [ ] Serveur redémarré après modification de `.env.local`
- [ ] Application redéployée après ajout dans Vercel

---

## 🔗 Liens Utiles

- [RevenueCat Dashboard](https://app.revenuecat.com/)
- [RevenueCat API Keys Documentation](https://www.revenuecat.com/docs/projects/authentication)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 💡 Notes Importantes

1. **Clé Publique** : 
   - ✅ Doit commencer par `NEXT_PUBLIC_` pour être accessible côté client
   - ✅ Peut être exposée dans le code (c'est normal)
   - ✅ Utilisez la clé de TEST pour le développement

2. **Clé Secrète** :
   - ❌ Ne JAMAIS commencer par `NEXT_PUBLIC_`
   - ❌ Ne JAMAIS être exposée côté client
   - ⚠️ Optionnelle (la plupart des cas d'usage n'en ont pas besoin)

3. **Environnements** :
   - **Test** : Utilisez les clés avec préfixe `test_` ou `sk_test_`
   - **Production** : Utilisez les clés avec préfixe `rcw_` ou `sk_live_`

---

**Une fois configuré, votre application utilisera automatiquement les bonnes clés selon l'environnement !** 🚀

