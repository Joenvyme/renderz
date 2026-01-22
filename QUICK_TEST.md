# 🚀 Test Rapide sans Clés API

Pour tester Renderz **immédiatement** sans configurer les clés API Banana Pro et Magnific AI :

## 1️⃣ Créer le fichier `.env.local`

Créez un fichier `.env.local` à la racine avec ce contenu :

```env
# Supabase (déjà configuré)
NEXT_PUBLIC_SUPABASE_URL=https://aodlfljsneigkrmjnpai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZGxmbGpzbmVpZ2tybWpucGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mjc0MzEsImV4cCI6MjA4MzMwMzQzMX0.e3sRE9kyNxtWeCIrF5mnBAajuvCv7ftPYE-HLnecego
SUPABASE_SERVICE_ROLE_KEY=votre_service_key_ici

# ✅ MODE MOCK - Activer pour tester sans clés API
MOCK_MODE=true
```

## 2️⃣ Obtenir la Service Role Key

1. Allez sur https://supabase.com/dashboard/project/aodlfljsneigkrmjnpai/settings/api
2. Copiez la clé **service_role**
3. Remplacez `votre_service_key_ici` dans `.env.local`

## 3️⃣ Lancer l'application

```bash
npm run dev
```

## 4️⃣ Tester !

1. Ouvrez http://localhost:3000
2. Uploadez une image
3. Entrez un prompt
4. Cliquez sur "GÉNÉRER LE RENDU"

Le mode MOCK va simuler les APIs :
- ✅ Upload réel vers Supabase
- 🍌 Génération simulée (Banana Pro Mock)
- ✨ Upscaling simulé (Magnific AI Mock)
- ✅ Enregistrement en base de données

---

## 🎯 Résultat attendu

Vous verrez dans la console :
```
🍌 [MOCK] Banana Pro generation simulated...
✨ [MOCK] Magnific AI upscaling simulated...
[uuid] Render completed successfully!
```

Une alerte s'affichera avec l'URL du rendu final (image de test SVG).

---

## ⚙️ Passer en mode Production

Une fois que vous avez obtenu vos vraies clés API :

1. Éditez `.env.local` et changez `MOCK_MODE=false`
2. Ajoutez vos clés :
   ```env
   BANANA_API_KEY=votre_clé
   BANANA_MODEL_KEY=votre_model_key
   MAGNIFIC_API_KEY=votre_clé
   ```
3. Redémarrez le serveur

Pour plus de détails, consultez [SETUP.md](./SETUP.md)

---

✅ **Vous êtes prêt à tester Renderz en mode MOCK !** 🎨






