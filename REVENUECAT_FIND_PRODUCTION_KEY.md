# 🔍 Comment Trouver la Clé de Production RevenueCat

## ❓ Problème : Je ne trouve pas ma clé de production

Si vous ne voyez pas la clé de production dans RevenueCat, voici les raisons possibles et les solutions.

---

## 🔍 Où Chercher la Clé

### 1. Emplacement Standard

**RevenueCat Dashboard** → **Votre Projet** → **Settings** → **API Keys**

Vous devriez voir :
- **Public SDK API Key (Test)** : `test_...`
- **Public SDK API Key (Production)** : `rcw_...` ← Celle-ci

---

## ⚠️ Raisons Pour Lesquelles Vous Ne La Voyez Pas

### Cas 1 : Projet en Mode Test/Sandbox

**Symptôme** : Vous ne voyez que la clé de test (`test_...`)

**Solution** :
1. Les clés de production sont généralement disponibles même en mode test
2. Vérifiez que vous êtes sur le bon projet
3. Essayez de rafraîchir la page
4. Si vraiment absente, contactez le support RevenueCat

### Cas 2 : Clé Non Générée

**Symptôme** : Seule la clé de test existe

**Solution** :
1. Les clés de production sont généralement créées automatiquement
2. Vérifiez dans **Settings** → **API Keys** s'il y a un bouton "Generate Production Key"
3. Si non disponible, la clé de test peut fonctionner en production aussi (selon votre plan RevenueCat)

### Cas 3 : Mauvais Projet

**Symptôme** : Vous ne voyez aucune clé

**Solution** :
1. Vérifiez que vous êtes connecté avec le bon compte
2. Vérifiez que vous avez sélectionné le bon projet
3. Vérifiez que vous avez les permissions d'administrateur

### Cas 4 : Plan Gratuit/Starter

**Symptôme** : Seule la clé de test est disponible

**Solution** :
- Certains plans RevenueCat peuvent limiter l'accès aux clés de production
- Vérifiez votre plan dans **Settings** → **Billing**
- Contactez le support si nécessaire

---

## 🔧 Solutions par Étape

### Solution 1 : Vérifier l'Emplacement Exact

1. **Allez sur** [RevenueCat Dashboard](https://app.revenuecat.com/)
2. **Sélectionnez votre projet** (renderz)
3. **Cliquez sur** l'icône ⚙️ **Settings** (en bas à gauche)
4. **Cliquez sur** **API Keys** dans le menu de gauche
5. **Cherchez** la section "Public SDK API Keys"

Vous devriez voir :
```
┌─────────────────────────────────────┐
│ Public SDK API Keys                 │
├─────────────────────────────────────┤
│ Test Key                            │
│ test_gCXwdEMumqTGFZxoNVUUROXtjVp   │
│                                     │
│ Production Key                      │
│ rcw_abc123def456...                 │ ← ICI
└─────────────────────────────────────┘
```

### Solution 2 : Utiliser la Clé de Test en Production

**Important** : Selon votre plan RevenueCat, vous pouvez utiliser la clé de **test** même en production !

**Vérification** :
1. Regardez votre plan RevenueCat dans **Settings** → **Billing**
2. Si vous êtes sur le plan **Starter** (gratuit), vous pouvez utiliser la clé de test partout
3. La clé de test fonctionne en production pour les plans gratuits

**Pour les plans payants** :
- La clé de production (`rcw_...`) est généralement disponible
- Si absente, contactez le support RevenueCat

### Solution 3 : Générer une Nouvelle Clé

Si la clé de production n'existe pas :

1. **RevenueCat Dashboard** → **Settings** → **API Keys**
2. Cherchez un bouton **"Generate Production Key"** ou **"Create Production Key"**
3. Si disponible, cliquez dessus
4. La clé sera générée automatiquement

**Note** : Cette option n'est pas toujours disponible selon votre plan.

### Solution 4 : Vérifier les Permissions

1. Vérifiez que vous êtes **administrateur** du projet
2. Si vous êtes **membre** (pas admin), vous ne verrez peut-être pas toutes les clés
3. Demandez à un administrateur de vous donner accès

---

## 💡 Solution Recommandée : Utiliser la Clé de Test

**Pour la plupart des cas**, surtout si vous êtes sur le plan Starter (gratuit) :

✅ **Vous pouvez utiliser la clé de TEST en production !**

```env
# Dans Vercel (Production)
NEXT_PUBLIC_REVENUECAT_API_KEY=test_gCXwdEMumqTGFZxoNVUUROXtjVp
```

**Avantages** :
- ✅ Fonctionne en production pour les plans gratuits
- ✅ Pas besoin de gérer deux clés différentes
- ✅ Plus simple à configurer

**Inconvénients** :
- ⚠️ Les transactions seront marquées comme "test" dans RevenueCat
- ⚠️ Certaines fonctionnalités avancées peuvent être limitées

---

## 🔐 Clé Secrète de Production

Pour la clé **secrète** de production :

1. **RevenueCat Dashboard** → **Settings** → **API Keys**
2. Cherchez la section **"Secret Keys"** ou **"Server API Keys"**
3. Vous devriez voir :
   - `sk_test_...` (test)
   - `sk_live_...` (production)

**Si absente** :
- La clé secrète est optionnelle
- Vous pouvez utiliser la clé publique côté serveur aussi
- Ou générer une nouvelle clé secrète si disponible

---

## 📞 Contacter le Support RevenueCat

Si vous ne trouvez toujours pas la clé de production :

1. **Support RevenueCat** : [support@revenuecat.com](mailto:support@revenuecat.com)
2. **Documentation** : [RevenueCat Support](https://www.revenuecat.com/docs)
3. **Community** : [RevenueCat Community](https://community.revenuecat.com/)

**Informations à fournir** :
- Votre projet ID
- Votre plan RevenueCat
- Capture d'écran de la page API Keys

---

## ✅ Configuration Recommandée

### Pour le Développement (`.env.local`)

```env
# Utilisez la clé de TEST
NEXT_PUBLIC_REVENUECAT_API_KEY=test_gCXwdEMumqTGFZxoNVUUROXtjVp
REVENUECAT_SECRET_KEY=sk_test_votre_cle_secrete
```

### Pour la Production (Vercel)

**Option 1 : Utiliser la clé de TEST** (recommandé pour plan gratuit)
```env
NEXT_PUBLIC_REVENUECAT_API_KEY=test_gCXwdEMumqTGFZxoNVUUROXtjVp
REVENUECAT_SECRET_KEY=sk_test_votre_cle_secrete
```

**Option 2 : Utiliser la clé de PRODUCTION** (si disponible)
```env
NEXT_PUBLIC_REVENUECAT_API_KEY=rcw_votre_cle_production
REVENUECAT_SECRET_KEY=sk_live_votre_cle_secrete_production
```

---

## 🎯 Conclusion

**Pour la plupart des cas** :
- ✅ Utilisez la clé de **TEST** même en production
- ✅ Elle fonctionne parfaitement pour les plans gratuits
- ✅ Plus simple à gérer

**Si vous avez vraiment besoin de la clé de production** :
- Contactez le support RevenueCat
- Vérifiez votre plan (certains plans nécessitent un upgrade)

---

**La clé de test fonctionne très bien en production pour la plupart des cas d'usage !** 🚀

