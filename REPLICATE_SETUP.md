# 🎨 Configuration Replicate API

## ⚡ Pourquoi Replicate ?

- ✅ **Gratuit pour commencer** (niveau gratuit généreux)
- ✅ **Flux Schnell** : Modèle rapide et de haute qualité
- ✅ **Simple** : 1 seule clé API
- ✅ **Fiable** : Plateforme stable et bien documentée

---

## 🔑 Obtenir votre Token Replicate

### 1️⃣ Créer un compte

1. Allez sur : **https://replicate.com/**
2. Cliquez sur **"Sign up"**
3. Connectez-vous avec GitHub (recommandé) ou email

### 2️⃣ Obtenir votre API Token

1. Une fois connecté, allez sur : **https://replicate.com/account/api-tokens**
2. Cliquez sur **"Create token"**
3. Donnez un nom au token (ex: "Renderz App")
4. **Copiez** le token (commence par `r8_...`)
5. ⚠️ **Important** : Sauvegardez-le, vous ne pourrez plus le voir !

### 3️⃣ Ajouter à `.env.local`

Éditez votre fichier `.env.local` et ajoutez :

```env
# Replicate API (Génération d'images)
REPLICATE_API_TOKEN=r8_...votre_token_ici
```

---

## 📋 Configuration complète de `.env.local`

Voici votre fichier `.env.local` complet avec Replicate :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://aodlfljsneigkrmjnpai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZGxmbGpzbmVpZ2tybWpucGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mjc0MzEsImV4cCI6MjA4MzMwMzQzMX0.e3sRE9kyNxtWeCIrF5mnBAajuvCv7ftPYE-HLnecego
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Replicate (Génération d'images avec Flux)
REPLICATE_API_TOKEN=r8_votre_token_ici

# Mode Mock (false pour utiliser la vraie API)
MOCK_MODE=false

# Magnific AI (Upscaling - optionnel)
MAGNIFIC_API_KEY=
```

---

## 💰 Tarification Replicate

### Niveau Gratuit
- **$0.006** par seconde de génération
- **Crédits gratuits** pour commencer
- Parfait pour le développement

### Flux Schnell (Modèle utilisé)
- **~4 secondes** par image
- **~$0.024** par image générée
- **Rapide et de qualité**

### Calcul d'exemple
- 100 images = ~$2.40
- 500 images = ~$12
- Le niveau gratuit vous donne plusieurs crédits pour tester !

---

## 🚀 Tester votre configuration

1. **Assurez-vous que `.env.local` est configuré** avec :
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `REPLICATE_API_TOKEN`
   - `MOCK_MODE=false`

2. **Redémarrez le serveur** :
   ```bash
   npm run dev
   ```

3. **Testez sur** : http://localhost:3000
   - Uploadez une image
   - Entrez un prompt
   - Cliquez sur "GÉNÉRER LE RENDU"

4. **Surveillez les logs** :
   ```
   [uuid] Starting Replicate (Flux) generation...
   🎨 Replicate generation completed!
   [uuid] Render completed successfully!
   ```

---

## 🎯 Modèles disponibles sur Replicate

### Flux Schnell (Utilisé par défaut) ⭐
- **Rapide** : ~4 secondes
- **Qualité** : Excellente
- **Prix** : ~$0.024/image

### Autres options
- **Stable Diffusion XL** : Plus lent, très haute qualité
- **Flux Pro** : Qualité maximale, plus cher
- **SDXL Lightning** : Ultra rapide (1 step)

Vous pouvez changer le modèle dans `lib/api/replicate.ts` !

---

## 🐛 Troubleshooting

### Erreur : "Invalid API token"
→ Vérifiez que vous avez copié le token complet
→ Assurez-vous qu'il commence par `r8_`

### Erreur : "Insufficient credits"
→ Vous avez épuisé les crédits gratuits
→ Ajoutez des crédits sur https://replicate.com/account/billing

### Génération très lente
→ Normal pour la première génération (téléchargement du modèle)
→ Les suivantes seront plus rapides

---

## 📚 Documentation officielle

- **Replicate** : https://replicate.com/
- **Flux Schnell** : https://replicate.com/black-forest-labs/flux-schnell
- **Documentation API** : https://replicate.com/docs
- **Tarification** : https://replicate.com/pricing

---

✅ **Vous êtes prêt à générer de vraies images avec Flux !** 🎨✨

Pour tester sans API : Gardez `MOCK_MODE=true` dans `.env.local`






