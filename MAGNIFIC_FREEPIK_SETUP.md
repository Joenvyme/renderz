# 🎨 Configuration Magnific AI (via Freepik API)

## 🔍 Important à savoir

**Magnific AI est hébergé sur l'API Freepik !**

Pour utiliser Magnific, vous devez :
1. Créer un compte Freepik Developer
2. Obtenir une clé API Freepik
3. S'abonner à un plan Freepik API (payant)

---

## 📋 Étapes de configuration

### 1️⃣ Créer un compte Freepik Developer

**Lien** : https://www.freepik.com/api

1. Cliquez sur **"Get Started"** ou **"Dashboard"**
2. Connectez-vous ou créez un compte Freepik
3. Acceptez les termes de service

---

### 2️⃣ Accéder au Dashboard

**Lien direct** : https://www.freepik.com/developers/dashboard

Vous verrez :
- Vos clés API
- Votre consommation
- Vos crédits

---

### 3️⃣ Créer une clé API

1. Dans le Dashboard, cliquez sur **"Create API Key"**
2. Donnez un nom à votre clé : **"Renderz App"**
3. Copiez la clé générée (format : `FPSX...`)

---

### 4️⃣ Souscrire à un plan

**Important** : L'API Freepik est **payante**.

Plans disponibles :
- **Basic** : ~$10-20/mois
- **Pro** : ~$50/mois
- **Enterprise** : Sur devis

Consultez : https://www.freepik.com/api#pricing

---

### 5️⃣ Configurer `.env.local`

Éditez votre fichier `.env.local` :

```env
# Google Gemini (déjà configuré ✅)
GOOGLE_GEMINI_API_KEY=AIzaSy...

# Magnific AI (via Freepik API)
MAGNIFIC_API_KEY=FPSX...VOTRE_CLE_FREEPIK_ICI

MOCK_MODE=false
```

---

### 6️⃣ Redémarrer et tester

```bash
npm run dev
```

Testez sur http://localhost:3000

---

## 📊 Paramètres disponibles

L'API Magnific sur Freepik offre plusieurs options :

### Scaling Factor
- **2x, 4x, 8x, 16x** : Facteur d'agrandissement

### Creativity (0-1)
- **0** : Fidèle à l'original
- **0.5** : Équilibré (recommandé)
- **1** : Très créatif

### Detail (0-1)
- **0** : Détails minimaux
- **1** : Maximum de détails

### Resemblance (0-1)
- **0** : Libre interprétation
- **1** : Très fidèle à l'original

### Fractality (0-1)
- **0** : Pas d'effets fractals
- **1** : Maximum d'effets fractals

---

## 💰 Coûts

### Freepik API Pricing (estimation)
- **Basic** : ~$10-20/mois + crédits
- Coût par upscale : ~$0.10-$0.30 selon la résolution
- **10k résolution** : Plus cher

### Comparaison avec Nano Banana seul
- **Nano Banana** : $0.02 par image (1024x1024)
- **Nano Banana + Magnific** : $0.02 + $0.20 = $0.22 par image (4096x4096)

---

## 🔄 Mode Async (recommandé pour production)

L'API Magnific utilise un système **asynchrone** :

1. Vous envoyez la requête → Vous recevez un `task_id`
2. Vous pollez le statut avec le `task_id`
3. Quand `status: "completed"`, vous récupérez l'URL de l'image

Pour implémenter le polling, consultez la documentation :
https://docs.freepik.com/api-reference/image-upscaler-creative/get-task-status

---

## ⚠️ Alternative : Utiliser Nano Banana seul

Si Magnific est trop cher pour commencer :

**Option 1** : Désactiver Magnific (configuration actuelle)
- L'app fonctionne sans Magnific
- Images 1024x1024 de Nano Banana (excellente qualité)
- Coût : $0.02 par image

**Option 2** : Ajouter Magnific plus tard
- Une fois que vous avez des revenus
- Pour offrir une option "Premium" à vos utilisateurs
- Images jusqu'à 10k résolution

---

## 🧪 Mode Mock pour tester

Si vous voulez tester l'interface sans payer :

```env
MOCK_MODE=true
```

Cela simulera les réponses de Magnific sans faire d'appels réels.

---

## 📚 Documentation

- **Freepik API Docs** : https://docs.freepik.com/
- **Magnific Upscaler Creative** : https://docs.freepik.com/api-reference/image-upscaler-creative/post-image-upscaler
- **Magnific Upscaler Precision** : https://docs.freepik.com/api-reference/image-upscaler-precision-v2/post-image-upscaler-precision-v2
- **Dashboard Freepik** : https://www.freepik.com/developers/dashboard

---

## ✅ Vérifier que ça fonctionne

### Logs de succès attendus

```
[uuid] Starting Nano Banana generation...
[uuid] Starting Magnific AI upscaling...
[uuid] Render completed successfully with upscaling!
```

### En cas d'erreur

```bash
# Erreur d'authentification
→ Vérifiez votre clé API Freepik
→ Assurez-vous d'avoir un plan actif

# Erreur de crédits
→ Rechargez vos crédits sur le Dashboard
→ Vérifiez votre plan

# Erreur de résolution
→ Limite : 25.3 mégapixels
→ Réduisez la taille de l'image source
```

---

**Besoin d'aide ?** Consultez le support Freepik : https://www.freepik.com/api#contact





