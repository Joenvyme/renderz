# 🧪 Test et Debug - Renderz

## 🎯 État actuel

✅ **Nano Banana (Google Gemini)** : Fonctionne parfaitement !
- Génération d'images : ✅
- Upload vers Supabase : ✅
- Enregistrement dans la DB : ✅
- Affichage dans l'app : ✅

⚠️ **Magnific AI (Freepik)** : À tester
- L'intégration est prête
- Besoin de voir les logs détaillés

---

## 🚀 Test complet

### 1️⃣ Redémarrez le serveur

```bash
# Ctrl+C pour arrêter
npm run dev
```

### 2️⃣ Générez un nouveau rendu

1. Allez sur http://localhost:3000
2. Uploadez une image
3. Entrez un prompt : "modern luxury apartment, photorealistic"
4. Cliquez sur "Générer le rendu"

### 3️⃣ **Nouveaux logs détaillés** ✅

Vous devriez maintenant voir **tous les détails** :

```
[uuid] Starting Nano Banana generation...
[uuid] Image URL: https://...
[uuid] Prompt: modern luxury...
✓ Image generated successfully! Size: 2395KB
✓ Image uploaded to Supabase: https://...
[uuid] ✓ Nano Banana generation complete!
[uuid] Generated image URL: https://...
[uuid] ✓ Database updated with generated image
[uuid] Starting Magnific AI upscaling...
[uuid] Calling Magnific with image: https://...
🔍 Magnific: Fetching image from URL: https://...
🔍 Magnific: Image downloaded, size: 2395KB
🔍 Magnific: Calling Freepik API with params: {
  scale_factor: '4x',
  optimized_for: 'standard',
  imageSize: '2395KB'
}
🔍 Magnific: API response status: 200 OK
🔍 Magnific: API response data: {
  status: 'IN_PROGRESS',
  task_id: '046b6c7f...',
  hasUrl: false
}
[uuid] Magnific result: {
  success: true,
  hasUrl: false,
  error: undefined
}
```

---

## 🔍 Comprendre les logs

### ✅ **Si Nano Banana fonctionne**

Vous verrez :
```
✓ Image generated successfully! Size: 2395KB
✓ Image uploaded to Supabase: https://...
[uuid] ✓ Nano Banana generation complete!
```

→ **Parfait !** L'image sera visible dans votre app et dans Supabase.

---

### ⚠️ **Si Magnific échoue** (normal sans compte payant)

**Cas 1 : Pas de clé API**
```
[uuid] No Magnific API key, skipping upscaling
[uuid] Render completed (without upscaling)!
```
→ Changez `MAGNIFIC_API_KEY=votre_cle_ici` dans `.env.local`

**Cas 2 : Erreur d'authentification (401/403)**
```
🔍 Magnific: API error details: {
  "message": "Invalid API key",
  "code": 401
}
⚠️ Magnific upscaling failed: Magnific AI API error: 401...
```
→ Votre clé Freepik est invalide ou expirée
→ Créez une nouvelle clé : https://www.freepik.com/developers/dashboard

**Cas 3 : Pas de crédits (402/429)**
```
🔍 Magnific: API error details: {
  "message": "Insufficient credits",
  "code": 402
}
⚠️ Magnific upscaling failed: Magnific AI API error: 402...
```
→ Votre compte Freepik n'a plus de crédits
→ Rechargez : https://www.freepik.com/api#pricing

**Cas 4 : Image trop grande (400)**
```
🔍 Magnific: API error details: {
  "message": "Image exceeds 25.3 megapixels",
  "code": 400
}
⚠️ Magnific upscaling failed: Magnific AI API error: 400...
```
→ L'image générée par Nano Banana est trop grande (rare)
→ L'app utilisera quand même l'image générée (sans upscaling)

**Cas 5 : Réponse asynchrone (task_id retourné)**
```
🔍 Magnific: API response data: {
  status: 'IN_PROGRESS',
  task_id: '046b6c7f...',
  hasUrl: false
}
⚠️ Magnific upscaling failed: Unknown error
```
→ L'API retourne un `task_id` au lieu d'une URL directe
→ Il faut implémenter le **polling** (système de vérification périodique)
→ Pour l'instant, l'app utilise l'image générée (sans upscaling)

---

## ✅ **Si Magnific fonctionne** (rare, besoin d'un compte payant)

Vous verrez :
```
🔍 Magnific: API response status: 200 OK
🔍 Magnific: API response data: {
  status: 'COMPLETED',
  task_id: '046b6c7f...',
  hasUrl: true
}
[uuid] Magnific result: {
  success: true,
  hasUrl: true,
  error: undefined
}
✓ Render completed successfully with upscaling!
```

→ **Parfait !** L'image upscalée sera visible dans votre app.

---

## 📊 Vérifier les résultats

### Dans l'app (http://localhost:3000)

Vous devriez voir :
- ✅ Une carte "RENDU GÉNÉRÉ ✓"
- ✅ L'image générée par Nano Banana
- ✅ Un bouton "TÉLÉCHARGER GÉNÉRÉ"
- ✅ (Si Magnific OK) Une deuxième image "MAGNIFIC AI (Upscaled 4x)"

### Dans Supabase

**Table `renders`** :
1. Allez sur votre projet Supabase
2. Table Editor → `renders`
3. Cherchez votre rendu (dernière ligne)
4. Vérifiez :
   - ✅ `generated_image_url` : doit être rempli
   - ✅ `upscaled_image_url` : doit être rempli (même valeur si pas d'upscaling)
   - ✅ `status` : doit être "completed"

**Storage `generated-renders`** :
1. Storage → `generated-renders`
2. Dossier `renders/`
3. Vous devriez voir : `generated-1767774593326-xj1xyi.png`
4. Cliquez dessus → L'image s'affiche

---

## 🐛 Problèmes courants

### "Magnific upscaling failed" sans détails

**Solution** : Relancez un rendu et copiez **tous les logs** qui commencent par `🔍 Magnific:`

Exemples :
```
🔍 Magnific: Fetching image from URL: ...
🔍 Magnific: Image downloaded, size: ...
🔍 Magnific: Calling Freepik API with params: ...
🔍 Magnific: API response status: ...
🔍 Magnific: API error details: ...
```

Envoyez-moi ces logs et je pourrai identifier le problème exact.

---

### L'image ne s'affiche pas dans l'app

**Vérifications** :
1. Ouvrez la console du navigateur (F12)
2. Cherchez les logs :
   - `Render status: completed`
   - `Generated URL: https://...`
   - `✓ Render completed! Displaying result...`
3. Vérifiez qu'il n'y a pas d'erreur CORS ou 404

**Si l'URL est `null` ou vide** :
→ Le problème est dans l'upload Supabase
→ Vérifiez que le bucket `generated-renders` est public

---

### Aucun log ne s'affiche

**Solution** :
1. Vérifiez que le serveur tourne : `npm run dev`
2. Regardez le bon terminal (celui qui affiche `▲ Next.js 14.2.35`)
3. Rafraîchissez la page et réessayez

---

## 🎯 Prochaines étapes

### Si Magnific ne fonctionne pas (normal)

**Option 1 : Continuer sans Magnific**
- ✅ Nano Banana génère déjà d'excellentes images (1024x1024)
- ✅ Gratuit ($300 de crédits Google)
- ✅ Parfait pour développer et tester

**Option 2 : Implémenter le polling Magnific**
- L'API Magnific est asynchrone (retourne `task_id`)
- Il faut poller toutes les 2-5 secondes pour obtenir le résultat
- Je peux l'implémenter si vous avez un compte Freepik actif

**Option 3 : Utiliser une alternative**
- Replicate (Flux Schnell) : gratuit avec crédits
- Upscale local : librairies comme Sharp.js
- Autres services : DeepAI, Stability AI

---

## 📝 Commande rapide pour tester

```bash
# Redémarrer et tester en une commande
npm run dev
```

Puis allez sur http://localhost:3000 et testez !

---

**Envoyez-moi les nouveaux logs (surtout ceux avec 🔍 Magnific:) et je vous dirai exactement ce qui se passe !** 🚀



