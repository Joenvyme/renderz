# 🔑 Configuration Google Gemini API

## ⚡ Obtenir votre clé API Google Gemini

### Option 1 : Google AI Studio (Gratuit pour commencer)

1. **Allez sur Google AI Studio** : https://aistudio.google.com/

2. **Connectez-vous** avec votre compte Google

3. **Obtenez votre clé API** :
   - Cliquez sur **"Get API Key"** en haut à droite
   - Ou allez sur : https://aistudio.google.com/app/apikey
   - Cliquez sur **"Create API Key"**
   - Sélectionnez un projet Google Cloud (ou créez-en un nouveau)
   - Copiez la clé générée

4. **Collez la clé** dans votre fichier `.env.local` :

```env
GOOGLE_GEMINI_API_KEY=AIzaSy...votre_clé_ici
```

---

### Option 2 : Google Cloud Console

1. **Allez sur Google Cloud Console** : https://console.cloud.google.com/

2. **Créez ou sélectionnez un projet**

3. **Activez l'API Gemini** :
   - Allez dans **"APIs & Services" > "Library"**
   - Cherchez **"Generative Language API"**
   - Cliquez sur **"Enable"**

4. **Créez une clé API** :
   - Allez dans **"APIs & Services" > "Credentials"**
   - Cliquez sur **"Create Credentials" > "API Key"**
   - Copiez la clé générée

5. **Collez la clé** dans votre `.env.local`

---

## 💰 Tarification Google Gemini

### Niveau Gratuit (Free Tier)
- **1,500 requêtes/jour** gratuites
- Parfait pour le développement et les tests
- Pas de carte de crédit requise

### Niveau Payant (Pay-as-you-go)
- **Gemini Pro** : ~$0.0025 par image
- **Imagen** : ~$0.02 par image
- Documentation : https://ai.google.dev/pricing

---

## 📋 Configuration complète de `.env.local`

Voici votre fichier `.env.local` complet :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://aodlfljsneigkrmjnpai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZGxmbGpzbmVpZ2tybWpucGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mjc0MzEsImV4cCI6MjA4MzMwMzQzMX0.e3sRE9kyNxtWeCIrF5mnBAajuvCv7ftPYE-HLnecego
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Google Gemini (NOUVEAU !)
GOOGLE_GEMINI_API_KEY=AIzaSy...votre_clé_ici

# Mode Mock (mettre à false pour utiliser la vraie API)
MOCK_MODE=false

# Magnific AI (pour l'upscaling)
MAGNIFIC_API_KEY=votre_clé_magnific
```

---

## ✅ Tester votre configuration

1. **Créez votre `.env.local`** avec toutes les clés

2. **Lancez le serveur** :
   ```bash
   npm run dev
   ```

3. **Testez l'upload** sur http://localhost:3000

4. **Surveillez les logs** dans la console :
   ```
   [uuid] Starting Google Gemini generation...
   ✨ [MOCK] Google Gemini generation simulated...
   [uuid] Render completed successfully!
   ```

---

## 🚀 Utiliser le Mode Production

Une fois votre clé Google Gemini configurée :

1. Dans `.env.local`, changez :
   ```env
   MOCK_MODE=false
   ```

2. Relancez le serveur

3. Uploadez une image et testez avec un vrai prompt !

---

## 🎯 Modèles disponibles

### Imagen 3 (Recommandé)
- Modèle : `imagen-3.0-generate-001`
- Meilleure qualité pour les rendus hyperréalistes
- Support de l'édition d'images

### Gemini Pro Vision
- Pour l'analyse et la compréhension d'images
- Peut être combiné avec Imagen

---

## 🐛 Troubleshooting

### Erreur : "API key not valid"
→ Vérifiez que vous avez copié la clé complète
→ Assurez-vous que l'API Generative Language est activée

### Erreur : "Quota exceeded"
→ Vous avez dépassé le quota gratuit de 1,500 requêtes/jour
→ Attendez le lendemain ou passez au niveau payant

### Erreur : "Model not found"
→ Vérifiez que vous utilisez le bon nom de modèle
→ Certains modèles nécessitent un accès spécial

---

## 📚 Documentation officielle

- **Google AI Studio** : https://aistudio.google.com/
- **Documentation Gemini** : https://ai.google.dev/docs
- **Tutoriels Imagen** : https://ai.google.dev/tutorials/image_generation
- **Tarification** : https://ai.google.dev/pricing

---

✅ **Vous êtes prêt à générer avec Google Gemini !** 🎨✨

