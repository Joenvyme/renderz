# 🎨 Renderz - AI Hyperrealistic Image Generation

Transformez vos images de référence en rendus hyperréalistes grâce à l'IA.

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Configuration des Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```env
# Supabase (déjà configuré)
NEXT_PUBLIC_SUPABASE_URL=https://aodlfljsneigkrmjnpai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Banana Pro API
BANANA_API_KEY=votre_banana_api_key
BANANA_MODEL_KEY=votre_banana_model_key

# Magnific AI
MAGNIFIC_API_KEY=votre_magnific_api_key
```

### 3. Obtenir les clés API

#### 📦 Supabase Service Role Key
1. Allez sur https://supabase.com/dashboard/project/aodlfljsneigkrmjnpai/settings/api
2. Copiez la clé "service_role" (secret)
3. Remplacez `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`

#### 🍌 Banana Pro API
1. Créez un compte sur https://www.banana.dev/
2. Obtenez votre API Key et Model Key
3. Documentation : https://docs.banana.dev/

#### ✨ Magnific AI
1. Créez un compte sur https://magnific.ai/
2. Obtenez votre API Key
3. Documentation : https://docs.magnific.ai/

### 4. Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📐 Architecture

### Stack Technique
- **Frontend** : Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/ui
- **Backend** : Next.js API Routes
- **Database** : Supabase (PostgreSQL)
- **Storage** : Supabase Storage
- **AI APIs** : Banana Pro (génération) + Magnific AI (upscaling)
- **Deployment** : Vercel

### Structure du Projet

```
renderz/
├── app/
│   ├── api/
│   │   ├── upload/          # Upload d'images
│   │   ├── generate/        # Génération de rendus
│   │   └── render/[id]/     # Récupération du statut
│   ├── globals.css          # Styles globaux + design system
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Landing page
├── components/
│   └── ui/                  # Composants Shadcn
├── lib/
│   ├── api/
│   │   ├── banana.ts        # Client Banana Pro
│   │   └── magnific.ts      # Client Magnific AI
│   ├── supabase/
│   │   ├── client.ts        # Client Supabase (client-side)
│   │   └── server.ts        # Client Supabase (server-side)
│   └── utils.ts             # Utilitaires
├── types/
│   └── database.ts          # Types TypeScript pour Supabase
└── PROJECT_REFERENCE.md     # Documentation complète du projet
```

## 🎨 Design System

### Identité Visuelle : Architectural Precision + Tech

- **Style** : Minimaliste, carré, structuré
- **Inspiration** : Software architect new age
- **Palette** : Sobre et professionnelle
- **Typographie** : Inter + JetBrains Mono
- **Caractéristiques** :
  - Grille architecturale subtile
  - Bordures doubles précises
  - Gradients tech pour les accents
  - Coins carrés (radius 0)
  - Micro-animations

### Classes Utilitaires Personnalisées

```css
.grid-pattern        /* Grille architecturale en background */
.tech-gradient       /* Gradient pour accents tech */
.architectural-border /* Bordure double précise */
```

## 🔄 Flow Utilisateur

1. **Upload** : Glisser-déposer une image de référence
2. **Prompt** : Saisir les instructions de génération
3. **Generate** : Lancer le processus IA
4. **Process** :
   - Upload vers Supabase Storage
   - Génération via Banana Pro API
   - Upscaling automatique via Magnific AI
5. **Result** : Affichage de l'image hyperréaliste finale

## 🗄️ Base de Données

### Tables

#### `users`
- `id` : UUID (Primary Key)
- `email` : TEXT
- `created_at` : TIMESTAMP
- `subscription_tier` : TEXT (free/pro/enterprise)
- `credits_remaining` : INT

#### `renders`
- `id` : UUID (Primary Key)
- `user_id` : TEXT
- `original_image_url` : TEXT
- `prompt` : TEXT
- `generated_image_url` : TEXT (nullable)
- `upscaled_image_url` : TEXT (nullable)
- `status` : TEXT (pending/processing/completed/failed)
- `created_at` : TIMESTAMP
- `metadata` : JSONB

### Storage Buckets

- `original-images` : Images uploadées (max 10MB)
- `generated-renders` : Images générées (max 50MB)
- `upscaled-renders` : Images finales (max 100MB)

## 🔌 API Routes

### POST `/api/upload`
Upload une image vers Supabase Storage.

**Request** : FormData avec fichier image

**Response** :
```json
{
  "success": true,
  "url": "https://...",
  "fileName": "..."
}
```

### POST `/api/generate`
Lance la génération d'un rendu.

**Request** :
```json
{
  "imageUrl": "https://...",
  "prompt": "Description du rendu souhaité"
}
```

**Response** :
```json
{
  "success": true,
  "renderId": "uuid",
  "status": "processing"
}
```

### GET `/api/render/[id]`
Récupère le statut et les résultats d'un rendu.

**Response** :
```json
{
  "id": "uuid",
  "status": "completed",
  "original_image_url": "https://...",
  "generated_image_url": "https://...",
  "upscaled_image_url": "https://...",
  "prompt": "...",
  "created_at": "..."
}
```

## 🧪 Testing

Pour tester l'application :

1. Lancez le serveur : `npm run dev`
2. Ouvrez http://localhost:3000
3. Glissez une image dans la zone de drop
4. Entrez un prompt (ex: "Photorealistic architectural render, golden hour")
5. Cliquez sur "GÉNÉRER LE RENDU"

**Note** : Assurez-vous d'avoir configuré toutes les clés API dans `.env.local` pour un test complet.

## 📚 Documentation Complète

Consultez [PROJECT_REFERENCE.md](./PROJECT_REFERENCE.md) pour :
- Architecture détaillée
- Roadmap complète
- Features futures
- Conventions de code
- Métriques de succès

## 🚀 Déploiement sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Configuration des variables d'environnement
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add BANANA_API_KEY
vercel env add BANANA_MODEL_KEY
vercel env add MAGNIFIC_API_KEY
```

## 📄 Licence

© 2026 Renderz - Tous droits réservés





