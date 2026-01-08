# 🚀 Démarrer avec Renderz

Bienvenue ! Voici comment tester votre application Renderz en 3 minutes.

---

## ⚡ Démarrage Rapide (Mode Test)

### 1. Créer `.env.local`

Créez un fichier `.env.local` **à la racine du projet** avec ce contenu :

```env
NEXT_PUBLIC_SUPABASE_URL=https://aodlfljsneigkrmjnpai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZGxmbGpzbmVpZ2tybWpucGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mjc0MzEsImV4cCI6MjA4MzMwMzQzMX0.e3sRE9kyNxtWeCIrF5mnBAajuvCv7ftPYE-HLnecego
SUPABASE_SERVICE_ROLE_KEY=VOTRE_CLE_SERVICE_ROLE_ICI
GOOGLE_GEMINI_API_KEY=VOTRE_CLE_GEMINI_ICI
MOCK_MODE=true
```

### 2. Obtenir les clés API (5 minutes)

#### A) Supabase Service Role Key
1. Ouvrez : https://supabase.com/dashboard/project/aodlfljsneigkrmjnpai/settings/api
2. Copiez la clé **`service_role`** (longue clé JWT)
3. Remplacez `VOTRE_CLE_SERVICE_ROLE_ICI` dans votre `.env.local`

#### B) Google Gemini API Key + Facturation (pour Nano Banana)

⚠️ **Important** : Nano Banana nécessite la facturation Google Cloud activée.

**Étapes rapides** :
1. Allez sur : https://console.cloud.google.com/billing
2. Activez la facturation (carte bancaire requise)
3. **Bonus** : $300 de crédits gratuits pendant 90 jours !
4. Créez une clé API sur : https://console.cloud.google.com/apis/credentials
5. Remplacez `VOTRE_CLE_GEMINI_ICI` dans votre `.env.local`

**Guide détaillé** : Consultez [GOOGLE_CLOUD_BILLING.md](./GOOGLE_CLOUD_BILLING.md)

> **Note** : En mode mock (`MOCK_MODE=true`), vous n'avez pas besoin de tout ça pour tester !

### 3. Lancer l'app

```bash
npm run dev
```

### 4. Tester !

1. Ouvrez http://localhost:3000
2. Glissez une image dans la zone centrale
3. Tapez un prompt (ex: "Modern architectural render, 8K")
4. Cliquez sur **"GÉNÉRER LE RENDU"**

**Résultat** : Le processus complet s'exécute en mode simulation (4 secondes) !

---

## 📊 Ce qui se passe en Mode Mock

- ✅ **Upload** : Votre image est uploadée vers Supabase (réel)
- 🍌 **Génération** : Simulée (Nano Banana Mock - 2s)
- 🔍 **Upscaling** : Simulé (Magnific AI Mock - 2s)
- 💾 **Database** : Sauvegarde réelle dans Supabase
- 📊 **Statut** : Suivi en temps réel

Vous verrez dans la console :
```
🍌 [MOCK] Nano Banana generation simulated...
✨ [MOCK] Magnific AI upscaling simulated...
[uuid] Render completed successfully!
```

---

## 🎯 Passer en Mode Production

Quand vous aurez les vraies clés API :

1. Éditez `.env.local`
2. Changez `MOCK_MODE=false`
3. Assurez-vous d'avoir :
   ```env
   GOOGLE_GEMINI_API_KEY=AIzaSy...
   MAGNIFIC_API_KEY=mag_...
   ```

Consultez [GEMINI_SETUP.md](./GEMINI_SETUP.md) pour obtenir votre clé Google Gemini gratuitement !

---

## 📚 Documentation

- **[GEMINI_SETUP.md](./GEMINI_SETUP.md)** : ⭐ Obtenir votre clé Google Gemini (gratuit!)
- **[NANO_BANANA.md](./NANO_BANANA.md)** : 🍌 Guide complet Nano Banana
- **[QUICK_TEST.md](./QUICK_TEST.md)** : Test sans clés API (mode mock)
- **[README.md](./README.md)** : Documentation technique
- **[PROJECT_REFERENCE.md](./PROJECT_REFERENCE.md)** : Référence complète du projet

---

## 🛠️ Structure du Projet

```
renderz/
├── app/
│   ├── api/              # Routes API (upload, generate, render)
│   ├── page.tsx          # Landing page
│   └── globals.css       # Design system
├── lib/
│   ├── api/              # Clients API (Banana, Magnific)
│   └── supabase/         # Client Supabase
├── components/ui/        # Composants Shadcn
└── types/                # Types TypeScript
```

---

## ✅ Checklist

- [ ] Créer `.env.local` avec les variables
- [ ] Obtenir la Supabase Service Role Key
- [ ] Lancer `npm run dev`
- [ ] Tester l'upload d'image
- [ ] Tester la génération en mode mock
- [ ] Vérifier les logs dans la console
- [ ] (Optionnel) Configurer les vraies clés API

---

## 🐛 Problèmes ?

### Port 3000 déjà utilisé
```bash
# Tuer les process sur le port 3000
lsof -ti:3000 | xargs kill -9
```

### Erreur de compilation
```bash
# Nettoyer et réinstaller
rm -rf node_modules .next
npm install
```

### Erreur Supabase
→ Vérifiez que la `SUPABASE_SERVICE_ROLE_KEY` est correcte

---

## 🎉 Prêt !

Vous êtes maintenant prêt à tester Renderz en mode mock !

Pour des rendus **réels avec IA**, configurez vos clés API en suivant [SETUP.md](./SETUP.md).

**Bon test !** 🎨✨

