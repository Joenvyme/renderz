# 🔑 Configuration de la Variable d'Environnement RevenueCat

## 📋 Étapes pour Intégrer la Clé API RevenueCat

### 1️⃣ Obtenir votre Clé API RevenueCat

1. Allez sur [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet
4. Allez dans **Project Settings** → **API Keys**
5. Copiez la **Public SDK API Key** (commence par `rcw_` ou `test_`)

⚠️ **IMPORTANT** : Utilisez la **clé PUBLIQUE** (Public SDK API Key), pas la clé secrète !

---

### 2️⃣ Configuration en Développement Local

#### Créer/Éditer `.env.local`

Créez ou éditez le fichier `.env.local` à la racine du projet :

```bash
# À la racine du projet renderz
touch .env.local
```

Ajoutez votre clé API :

```env
# RevenueCat - Clé PUBLIQUE (SDK API Key)
# Format: commence par "rcw_" (production) ou "test_" (test)
NEXT_PUBLIC_REVENUECAT_API_KEY=test_gCXwdEMumqTGFZxoNVUUROXtjVp
```

**Remplacez** `test_gCXwdEMumqTGFZxoNVUUROXtjVp` par votre vraie clé RevenueCat.

#### Vérifier que ça fonctionne

1. Redémarrez le serveur de développement :
   ```bash
   npm run dev
   ```

2. Vérifiez dans la console du navigateur qu'il n'y a pas d'erreur RevenueCat

3. Testez l'initialisation en ouvrant la page principale

---

### 3️⃣ Configuration en Production (Vercel)

#### Option 1 : Via l'Interface Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet **renderz**
3. Allez dans **Settings** → **Environment Variables**
4. Cliquez sur **Add New**
5. Ajoutez :
   - **Name** : `NEXT_PUBLIC_REVENUECAT_API_KEY`
   - **Value** : Votre clé RevenueCat (production : `rcw_...`)
   - **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
6. Cliquez sur **Save**

#### Option 2 : Via Vercel CLI

```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Ajouter la variable d'environnement
vercel env add NEXT_PUBLIC_REVENUECAT_API_KEY

# Suivre les instructions pour entrer la valeur
# Sélectionner les environnements (Production, Preview, Development)
```

#### Redéployer après ajout

Après avoir ajouté la variable, **redéployez** votre application :

```bash
# Via Vercel CLI
vercel --prod

# Ou via l'interface Vercel : Settings → Deployments → Redeploy
```

---

### 4️⃣ Vérification

#### En Développement

1. Vérifiez que `.env.local` contient bien la variable :
   ```bash
   cat .env.local | grep REVENUECAT
   ```

2. Redémarrez le serveur :
   ```bash
   npm run dev
   ```

3. Ouvrez la console du navigateur (F12) et vérifiez qu'il n'y a pas d'erreur RevenueCat

#### En Production

1. Allez sur votre site en production
2. Ouvrez la console du navigateur (F12)
3. Vérifiez qu'il n'y a pas d'erreur RevenueCat
4. Testez l'ouverture du paywall

---

### 5️⃣ Structure Recommandée des Variables

#### `.env.local` (Développement)

```env
# RevenueCat - Clé PUBLIQUE (SDK API Key)
# Utilisez la clé de TEST pour le développement
NEXT_PUBLIC_REVENUECAT_API_KEY=test_gCXwdEMumqTGFZxoNVUUROXtjVp

# Autres variables...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# etc.
```

#### Vercel (Production)

- **Production** : Clé publique de PRODUCTION (`rcw_...`)
- **Preview** : Clé publique de TEST (`test_...`) ou PRODUCTION
- **Development** : Clé publique de TEST (`test_...`)

---

### 6️⃣ Dépannage

#### ❌ Erreur : "API key not valid"

**Cause** : La clé est incorrecte ou n'est pas chargée

**Solution** :
1. Vérifiez que la clé est bien dans `.env.local` (dev) ou Vercel (prod)
2. Vérifiez que vous utilisez la **clé publique**, pas la clé secrète
3. Redémarrez le serveur après modification de `.env.local`

#### ❌ Erreur : "No offerings available"

**Cause** : Aucune offre configurée dans RevenueCat Dashboard

**Solution** :
1. Allez dans RevenueCat Dashboard
2. Configurez vos produits et offerings
3. Créez un offering "default" ou "current"

#### ❌ La variable n'est pas chargée

**Cause** : Next.js ne charge pas les variables `NEXT_PUBLIC_*`

**Solution** :
1. Vérifiez que le nom commence bien par `NEXT_PUBLIC_`
2. Redémarrez le serveur de développement
3. En production, redéployez après avoir ajouté la variable

---

### 7️⃣ Checklist

- [ ] Clé RevenueCat obtenue (Public SDK API Key)
- [ ] Variable ajoutée dans `.env.local` (développement)
- [ ] Variable ajoutée dans Vercel (production)
- [ ] Serveur redémarré (développement)
- [ ] Application redéployée (production)
- [ ] Testé en développement (pas d'erreur console)
- [ ] Testé en production (paywall fonctionne)

---

### 📚 Ressources

- [RevenueCat Dashboard](https://app.revenuecat.com/)
- [RevenueCat API Keys Documentation](https://www.revenuecat.com/docs/projects/authentication)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

✅ **Une fois configuré, votre application utilisera automatiquement la clé RevenueCat !**


