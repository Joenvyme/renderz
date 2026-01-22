# 🔑 Comment Obtenir la Clé de Production RevenueCat

## 📍 Étapes pour Obtenir la Clé Publique de Production

### 1. Accéder au Dashboard RevenueCat

1. Allez sur [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet **renderz**

### 2. Naviguer vers les API Keys

1. Dans le menu de gauche, cliquez sur **Project Settings** (ou **Settings**)
2. Cliquez sur l'onglet **API Keys** (ou **Keys**)

### 3. Trouver la Clé Publique de Production

Vous verrez plusieurs clés :

#### Clé de TEST (pour le développement)
- **Label** : "Public SDK API Key (Test)" ou "Test Key"
- **Format** : Commence par `test_...`
- **Exemple** : `test_gCXwdEMumqTGFZxoNVUUROXtjVp`
- **Usage** : Développement local, tests

#### Clé de PRODUCTION (pour la production)
- **Label** : "Public SDK API Key (Production)" ou "Production Key"
- **Format** : Commence par `rcw_...`
- **Exemple** : `rcw_abc123def456ghi789...`
- **Usage** : Production, Vercel

### 4. Copier la Clé de Production

1. Trouvez la clé qui commence par `rcw_`
2. Cliquez sur l'icône de copie à côté de la clé
3. Ou sélectionnez et copiez manuellement

---

## 🔍 Où Trouver dans l'Interface

### Chemin Complet

```
RevenueCat Dashboard
  → Votre Projet (renderz)
    → Settings (ou Project Settings)
      → API Keys (ou Keys)
        → Public SDK API Key (Production)
          → Clé commençant par "rcw_"
```

### Visualisation

```
┌─────────────────────────────────────┐
│  Project Settings                   │
├─────────────────────────────────────┤
│  [General] [API Keys] [Integrations]│
├─────────────────────────────────────┤
│                                     │
│  Public SDK API Keys                │
│  ┌───────────────────────────────┐ │
│  │ Test Key                       │ │
│  │ test_gCXwdEMumqTGFZxoNVUUROXtjVp│ │
│  │ [Copy]                         │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Production Key                 │ │
│  │ rcw_abc123def456ghi789...     │ │ ← C'EST CELLE-CI
│  │ [Copy]                         │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

## ⚠️ Si Vous Ne Voyez Pas la Clé de Production

### Cas 1 : Projet en Mode Test

Si votre projet est encore en mode test/sandbox :
- La clé de production peut ne pas être disponible
- Vous devez peut-être activer la production dans RevenueCat
- Contactez le support RevenueCat si nécessaire

### Cas 2 : Nouveau Projet

Si c'est un nouveau projet :
- Les clés de production sont généralement disponibles immédiatement
- Vérifiez que vous êtes sur le bon projet
- Assurez-vous d'avoir les permissions nécessaires

### Cas 3 : Clé Non Visible

Si la clé n'est pas visible :
1. Vérifiez que vous êtes connecté avec le bon compte
2. Vérifiez que vous avez les permissions d'administrateur
3. Essayez de rafraîchir la page
4. Contactez le support RevenueCat

---

## 📝 Après Avoir Obtenu la Clé

### 1. Ajouter dans Vercel (Production)

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet **renderz**
3. Allez dans **Settings** → **Environment Variables**
4. Cliquez sur **Add New**
5. Ajoutez :
   - **Name** : `NEXT_PUBLIC_REVENUECAT_API_KEY`
   - **Value** : `rcw_votre_cle_production` (collez la clé que vous avez copiée)
   - **Environment** : Sélectionnez **Production**
6. Cliquez sur **Save**

### 2. Redéployer

Après avoir ajouté la variable :
- Allez dans **Deployments**
- Cliquez sur **Redeploy** sur le dernier déploiement
- Ou faites un nouveau commit pour déclencher un déploiement

---

## 🔐 Clé Secrète de Production

Pour obtenir la clé **secrète** de production :

1. Dans **API Keys**, cherchez la section **Secret Keys**
2. Trouvez la clé qui commence par `sk_live_...`
3. Copiez-la
4. Ajoutez-la dans Vercel comme `REVENUECAT_SECRET_KEY` (sans `NEXT_PUBLIC_`)

**⚠️ Important** : La clé secrète ne doit JAMAIS être exposée côté client !

---

## ✅ Vérification

Après avoir configuré :

1. **Vérifiez dans Vercel** que la variable est bien ajoutée
2. **Redéployez** l'application
3. **Testez** en production que RevenueCat fonctionne
4. **Vérifiez les logs** pour confirmer qu'il n'y a pas d'erreur

---

## 🔗 Liens Utiles

- [RevenueCat Dashboard](https://app.revenuecat.com/)
- [RevenueCat API Keys Documentation](https://www.revenuecat.com/docs/projects/authentication)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 💡 Astuce

**Pour le développement** : Utilisez la clé de TEST (`test_...`)  
**Pour la production** : Utilisez la clé de PRODUCTION (`rcw_...`)

Vous pouvez avoir les deux configurées dans différents environnements Vercel ! 🚀

