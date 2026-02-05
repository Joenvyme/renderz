# ✅ Étapes d'activation après création du compte de facturation

## ⚠️ Problème actuel

Votre clé API utilise encore le **quota gratuit (free tier)** qui est limité à 0 requêtes pour Nano Banana.

```
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0
```

## 🎯 Solution : Créer une clé API liée au compte payant

---

## 📋 Étapes à suivre (5 minutes)

### 1️⃣ Activer l'API Generative Language

**Lien direct** : https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com

1. Cliquez sur **"ACTIVER"** (Enable)
2. Attendez quelques secondes
3. Vous verrez "API activée" ✅

---

### 2️⃣ Créer une nouvelle clé API

**Lien direct** : https://console.cloud.google.com/apis/credentials

1. Vérifiez que vous êtes bien dans **votre projet** (en haut de la page)
2. Cliquez sur **"+ CRÉER DES IDENTIFIANTS"** en haut
3. Sélectionnez **"Clé API"**
4. Une nouvelle clé est générée (commence par `AIzaSy...`)
5. **COPIEZ cette clé** immédiatement

---

### 3️⃣ Restreindre la clé (sécurité recommandée)

1. Cliquez sur **"RESTREINDRE LA CLÉ"** dans la popup
2. Ou cliquez sur l'icône ✏️ (crayon) à côté de votre nouvelle clé
3. Dans **"Restrictions relatives aux applications"** :
   - Laissez sur **"Aucune"** pour tester
   - Ou sélectionnez **"Adresses IP"** et ajoutez votre IP
4. Dans **"Restrictions relatives aux API"** :
   - Sélectionnez **"Limiter la clé"**
   - Cochez ☑️ **"Generative Language API"**
5. Cliquez sur **"ENREGISTRER"**

---

### 4️⃣ Mettre à jour `.env.local`

Ouvrez `/Users/weblaw/Joenvyme/renderz/.env.local` et remplacez :

```env
# ❌ ANCIENNE CLÉ (AI Studio - gratuit)
GOOGLE_GEMINI_API_KEY=AIzaSy...ANCIENNE_CLE

# ✅ NOUVELLE CLÉ (Google Cloud - avec facturation)
GOOGLE_GEMINI_API_KEY=AIzaSy...NOUVELLE_CLE_ICI

# Mode production
MOCK_MODE=false
```

---

### 5️⃣ Redémarrer le serveur

Dans votre terminal :

```bash
# Ctrl+C pour arrêter le serveur
# Puis relancer
npm run dev
```

---

### 6️⃣ Tester un rendu

1. Allez sur http://localhost:3000
2. Upload une image
3. Entrez un prompt : "modern luxury apartment, photorealistic"
4. Cliquez sur "Generate Render"

---

## ✅ Ce que vous devriez voir dans les logs

```
[uuid] Starting Nano Banana generation...
✓ Image generated successfully!
[uuid] Starting Magnific upscaling...
✓ Render complete!
```

---

## 🐛 Si ça ne marche toujours pas

### Erreur : "free_tier_requests, limit: 0"
→ **Attendez 5-10 minutes** pour que les changements se propagent
→ Vérifiez que vous avez créé la clé depuis **Google Cloud Console** (pas AI Studio)
→ Vérifiez que votre projet a bien la **facturation activée**

### Vérifier la facturation du projet

1. Allez sur : https://console.cloud.google.com/billing/projects
2. Cherchez votre projet
3. Vérifiez qu'un compte de facturation est associé
4. Sinon, cliquez sur **"⋮"** → **"Changer le compte de facturation"**

### Vérifier les quotas

1. Allez sur : https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
2. Cherchez **"generate_content"**
3. Vérifiez que les limites ne sont **PAS à 0**
4. Si elles sont à 0, attendez quelques minutes

---

## 💡 Astuce : Mode Mock pour tester

Si vous voulez tester l'interface pendant que la propagation se fait :

```env
MOCK_MODE=true
```

Cela simulera les réponses de l'API sans faire d'appels réels.

---

## 📞 Liens utiles

- **Console Cloud** : https://console.cloud.google.com/
- **Activer l'API** : https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
- **Créer clé API** : https://console.cloud.google.com/apis/credentials
- **Facturation** : https://console.cloud.google.com/billing
- **Quotas** : https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

---

**Temps estimé** : 5 minutes + 5-10 minutes de propagation







