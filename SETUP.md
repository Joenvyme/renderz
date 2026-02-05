# ⚙️ Configuration de Renderz

## 🔑 Étapes pour configurer les clés API

### 1. Créer le fichier `.env.local`

À la racine du projet, créez un fichier `.env.local` avec ce contenu :

```env
# ✅ Supabase - DÉJÀ CONFIGURÉ
NEXT_PUBLIC_SUPABASE_URL=https://aodlfljsneigkrmjnpai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZGxmbGpzbmVpZ2tybWpucGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mjc0MzEsImV4cCI6MjA4MzMwMzQzMX0.e3sRE9kyNxtWeCIrF5mnBAajuvCv7ftPYE-HLnecego

# ❗ À COMPLÉTER - Supabase Service Role Key
SUPABASE_SERVICE_ROLE_KEY=

# ❗ À COMPLÉTER - Banana Pro API
BANANA_API_KEY=
BANANA_MODEL_KEY=

# ❗ À COMPLÉTER - Magnific AI
MAGNIFIC_API_KEY=
```

---

## 📦 Obtenir la Supabase Service Role Key

1. Allez sur : https://supabase.com/dashboard/project/aodlfljsneigkrmjnpai/settings/api
2. Dans la section **Project API keys**
3. Copiez la clé **`service_role`** (c'est une clé secrète, ne la partagez jamais)
4. Collez-la dans `.env.local` à la ligne `SUPABASE_SERVICE_ROLE_KEY=`

---

## 🍌 Obtenir les clés Banana Pro API

### Option A : Si vous avez déjà un compte Banana

1. Allez sur https://app.banana.dev/
2. Dans **API Keys**, copiez votre clé API
3. Dans **Models**, sélectionnez votre modèle et copiez le Model Key

### Option B : Créer un nouveau compte

1. Allez sur https://www.banana.dev/
2. Cliquez sur **Sign Up** / **Get Started**
3. Créez votre compte
4. Suivez les étapes pour :
   - Obtenir votre **API Key**
   - Déployer ou sélectionner un modèle d'image generation
   - Obtenir votre **Model Key**
5. Documentation : https://docs.banana.dev/

### Modèles recommandés pour Renderz

- **Stable Diffusion XL** : Génération d'images haute qualité
- **ControlNet** : Pour maintenir la structure de l'image de référence
- **Flux** : Modèle rapide et performant

Collez les clés dans `.env.local` :
```env
BANANA_API_KEY=votre_clé_api_ici
BANANA_MODEL_KEY=votre_model_key_ici
```

---

## ✨ Obtenir la clé Magnific AI

### Option A : Si vous avez déjà un compte Magnific

1. Allez sur https://magnific.ai/
2. Connectez-vous à votre compte
3. Allez dans **Settings** → **API**
4. Générez ou copiez votre clé API

### Option B : Créer un nouveau compte

1. Allez sur https://magnific.ai/
2. Créez un compte (peut nécessiter un abonnement)
3. Accédez à l'API dans les paramètres
4. Générez votre clé API

Collez la clé dans `.env.local` :
```env
MAGNIFIC_API_KEY=votre_clé_magnific_ici
```

---

## ✅ Vérification

Une fois toutes les clés configurées, votre `.env.local` devrait ressembler à :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://aodlfljsneigkrmjnpai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Banana Pro
BANANA_API_KEY=sk_banana_xxxxxxxxxxxx
BANANA_MODEL_KEY=model_xxxxxxxxx

# Magnific AI
MAGNIFIC_API_KEY=mag_sk_xxxxxxxxxxxx
```

---

## 🚀 Test de l'application

1. Redémarrez le serveur si nécessaire :
   ```bash
   npm run dev
   ```

2. Ouvrez http://localhost:3000

3. Testez le flow complet :
   - Uploadez une image
   - Entrez un prompt (ex: "Photorealistic render, 8K, cinematic lighting")
   - Cliquez sur "GÉNÉRER LE RENDU"

4. Surveillez la console pour voir le processus :
   - Upload → Supabase Storage ✅
   - Génération → Banana Pro ⏳
   - Upscaling → Magnific AI ⏳
   - Résultat final ✨

---

## 🐛 Troubleshooting

### Erreur : "Missing imageUrl or prompt"
→ Assurez-vous d'avoir uploadé une image et saisi un prompt

### Erreur : "Banana Pro API credentials not configured"
→ Vérifiez que `BANANA_API_KEY` et `BANANA_MODEL_KEY` sont dans `.env.local`

### Erreur : "Magnific AI API credentials not configured"
→ Vérifiez que `MAGNIFIC_API_KEY` est dans `.env.local`

### Erreur : "Failed to upload file"
→ Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est correcte

### Le rendu reste en "processing" indéfiniment
→ Vérifiez les logs de la console pour voir où le processus échoue
→ Vérifiez que vos clés API sont valides et ont des crédits disponibles

---

## 💡 Alternatives pour tester sans API

Si vous n'avez pas encore les clés API, vous pouvez :

1. **Mode Mock** : Modifier les fichiers dans `lib/api/` pour retourner des images de test
2. **Utiliser des services gratuits** : Replicate.com offre des crédits gratuits pour tester
3. **Images de démonstration** : Utiliser des URLs d'images fixes pour simuler le résultat

---

## 📞 Support

Pour toute question :
- Consultez le [PROJECT_REFERENCE.md](./PROJECT_REFERENCE.md)
- Lisez le [README.md](./README.md)
- Vérifiez la documentation des APIs

---

✅ Une fois configuré, vous êtes prêt à générer des rendus hyperréalistes ! 🎨







