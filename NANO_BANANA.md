# 🍌 Guide Nano Banana (Google Gemini)

## 🎉 VOUS AVIEZ RAISON !

Nano Banana est **directement disponible** via l'API Google Gemini gratuite !

**Documentation officielle** : [Génération d'images avec Gemini](https://ai.google.dev/gemini-api/docs/image-generation?authuser=1&hl=fr)

> **Gemini 2.5 Flash Image** (alias Nano Banana) : Modèle de génération d'images rapide et efficace
> 
> **Gemini 3 Pro Image Preview** (alias Nano Banana Pro) : Production d'assets professionnels jusqu'à 4K

---

## ✅ Avantages de Nano Banana

- ✅ **Gratuit** : 1,500 requêtes/jour
- ✅ **Simple** : 1 seule clé API
- ✅ **Officiel Google** : Support complet
- ✅ **Rapide** : Génération en quelques secondes
- ✅ **Haute qualité** : Modèle de pointe Google
- ✅ **Pas de carte bancaire** : Google AI Studio gratuit

---

## 🔑 Configuration (2 minutes)

### 1️⃣ Obtenir votre clé API

1. Allez sur : **https://aistudio.google.com/app/apikey**
2. Connectez-vous avec votre compte Google
3. Cliquez sur **"Create API Key"**
4. Copiez la clé (commence par `AIzaSy...`)

### 2️⃣ Ajouter à `.env.local`

```env
# Google Gemini API (Nano Banana)
GOOGLE_GEMINI_API_KEY=AIzaSy...votre_clé_ici

# Mode production (false pour utiliser la vraie API)
MOCK_MODE=false
```

### 3️⃣ C'est tout ! 🎉

Relancez le serveur et testez :

```bash
npm run dev
```

---

## 📊 Modèles disponibles

### Gemini 2.5 Flash Image (Nano Banana) ⚡
- **Modèle** : `gemini-2.5-flash-image`
- **Résolution** : 1024x1024 (format 1:1)
- **Vitesse** : Optimisé pour la rapidité
- **Usage** : Volume élevé, faible latence
- **Tokens** : 1290 par image
- [Documentation](https://ai.google.dev/gemini-api/docs/image-generation?authuser=1&hl=fr)

### Gemini 3 Pro Image Preview (Nano Banana Pro) 🎨
- **Modèle** : `gemini-3-pro-image-preview`
- **Résolution** : Jusqu'à 4096x4096 (4K)
- **Qualité** : Production professionnelle
- **Usage** : Assets de haute qualité
- **Tokens** : 1120-4000 selon résolution
- **Bonus** : Recherche Google intégrée

---

## 🎯 Formats disponibles

### Nano Banana (2.5 Flash)
- 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
- Résolution fixe optimisée par format

### Nano Banana Pro (3 Pro)
- Mêmes formats
- Résolutions : 1K, 2K, 4K (au choix)
- Meilleur pour production finale

---

## 💰 Tarification

### ⚠️ Important : Facturation requise

**Nano Banana n'est PAS dans le tier gratuit AI Studio.**

Vous devez activer la facturation Google Cloud :
- ✅ **$300 de crédits gratuits** pendant 90 jours
- ✅ Pas de débit tant que vous ne dépassez pas
- ✅ Carte bancaire requise (pour vérification)

**Guide complet** : Voir [GOOGLE_CLOUD_BILLING.md](./GOOGLE_CLOUD_BILLING.md)

### Coût après crédits gratuits
- **Gemini 2.5 Flash Image** : ~$0.02 par image
- **Gemini 3 Pro Image** : ~$0.04-$0.08 par image
- **1290-4000 tokens** selon résolution

### Exemple avec crédits gratuits
- $300 = **15,000 images** avec Nano Banana
- Largement suffisant pour développer et tester !

---

## 🎯 Utilisation dans Renderz

L'application utilise maintenant **Nano Banana** pour :

1. **Génération d'images** à partir de vos références
2. **Retouche intelligente** basée sur votre prompt
3. **Rendu hyperréaliste** en quelques secondes

### Flow complet :

```
Upload Image
    ↓
Supabase Storage
    ↓
🍌 Nano Banana (Google) → Génération intelligente
    ↓
Magnific AI → Upscaling 4x
    ↓
Résultat Final HD
```

---

## 🧪 Tester en Mode Mock

Si vous n'avez pas encore la clé API :

```env
MOCK_MODE=true
```

Vous pouvez tester tout le flow sans clé !

---

## 🚀 Exemples de prompts

### Pour l'architecture
```
"Photorealistic architectural render, modern building, golden hour lighting, 8K quality, professional camera"
```

### Pour le design de produit
```
"Professional product photography, studio lighting, white background, hyperrealistic details, commercial quality"
```

### Pour les intérieurs
```
"Interior design render, modern minimalist style, natural daylight, photorealistic materials, architectural photography"
```

---

## 🐛 Troubleshooting

### Erreur : "API key not valid"
→ Vérifiez que vous avez copié la clé complète depuis Google AI Studio
→ La clé doit commencer par `AIzaSy`

### Erreur : "Quota exceeded"
→ Vous avez dépassé les 1,500 requêtes/jour gratuites
→ Attendez le lendemain ou passez au mode payant

### Erreur : "Model not found"
→ Nano Banana est en cours de déploiement sur votre région
→ Essayez à nouveau dans quelques heures

### L'image ne correspond pas au prompt
→ Améliorez votre prompt avec plus de détails
→ Ajoutez des termes comme "photorealistic", "8K", "professional"

---

## 📚 Documentation officielle

- **Google AI Studio** : https://aistudio.google.com/
- **Documentation API** : https://ai.google.dev/gemini-api/docs
- **Nano Banana** : https://ai.google.dev/gemini-api/docs (section Images)
- **Tarification** : https://ai.google.dev/pricing

---

## 🎉 Félicitations !

Vous utilisez maintenant **Nano Banana de Google** pour générer des rendus hyperréalistes !

- ✅ Configuration simple
- ✅ Gratuit pour commencer
- ✅ Qualité professionnelle
- ✅ Support officiel Google

**Lancez votre premier rendu maintenant !** 🍌✨

