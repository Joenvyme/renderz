# 🎨 Renderz - Plan de Référence du Projet

## 📋 Vue d'ensemble

**Renderz** est une application SaaS qui transforme des photos de référence (croquis, dessins, rendus sans texture, photos basse qualité) en images hyperréalistes de haute qualité grâce à l'IA.

---

## 🎯 Proposition de Valeur

- **Input** : Photo de référence (n'importe quelle qualité) + Prompt d'instructions
- **Process** : Génération via Banana Pro API → Upscaling automatique via Magnific AI
- **Output** : Image hyperréaliste en haute qualité en un seul prompt

---

## 🎨 Identité Visuelle

### Style Design
- **Esthétique** : Moderne, minimaliste, carré
- **Inspiration** : Software architect new age
- **Caractéristiques** :
  - Lignes épurées et géométriques
  - Espaces blancs généreux
  - Typographie moderne et technique
  - Palette de couleurs sobre et professionnelle
  - Interface carrée et structurée

### Mood Board
- Minimalisme architectural
- Interface type IDE/Software Design
- Grille carrée stricte
- Contraste élevé
- Micro-interactions subtiles

---

## 🏗️ Stack Technique

### Frontend
- **Framework** : Next.js 14+ (App Router)
- **Styling** : Tailwind CSS
- **Composants** : Shadcn/ui
- **Langage** : TypeScript

### Backend & Services
- **Base de données** : Supabase (PostgreSQL)
- **Authentication** : Supabase Auth
- **Storage** : Supabase Storage (pour les images)
- **Hosting** : Vercel

### APIs Externes
- **Banana Pro API** : Génération de rendus IA
- **Magnific AI API** : Upscaling automatique

---

## 📐 Architecture de l'Application

### Structure des Pages

```
/
├── app/
│   ├── (landing)/
│   │   └── page.tsx              # Landing page avec chat central
│   ├── (app)/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard utilisateur
│   │   ├── gallery/
│   │   │   └── page.tsx          # Galerie de rendus
│   │   └── settings/
│   │       └── page.tsx          # Paramètres
│   └── api/
│       ├── generate/
│       │   └── route.ts          # API Banana Pro
│       └── upscale/
│           └── route.ts          # API Magnific AI
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── ImageUpload.tsx
│   │   └── PromptInput.tsx
│   ├── gallery/
│   │   ├── ImageGrid.tsx
│   │   └── ImageCard.tsx
│   └── ui/                       # Shadcn components
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── api/
│   │   ├── banana.ts
│   │   └── magnific.ts
│   └── utils/
└── types/
    └── index.ts
```

---

## 🗄️ Modèle de Données (Supabase)

### Table: `users`
```sql
- id (uuid, primary key)
- email (text)
- created_at (timestamp)
- subscription_tier (text) # free, pro, enterprise
- credits_remaining (int)
```

### Table: `renders`
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- original_image_url (text)
- prompt (text)
- generated_image_url (text)
- upscaled_image_url (text)
- status (text) # pending, processing, completed, failed
- created_at (timestamp)
- metadata (jsonb) # dimensions, modèle utilisé, etc.
```

### Storage Buckets
- `original-images` : Photos uploadées par les utilisateurs
- `generated-renders` : Images générées par Banana Pro
- `upscaled-renders` : Images finales upscalées

---

## 🔄 Flux de Travail Utilisateur

### 1. Landing Page
```
┌─────────────────────────────────────┐
│                                     │
│         RENDERZ Logo                │
│                                     │
│   ┌─────────────────────────────┐  │
│   │                             │  │
│   │   💬 Chat Interface         │  │
│   │                             │  │
│   │   [Upload Image Zone]       │  │
│   │                             │  │
│   │   [Prompt Input]            │  │
│   │                             │  │
│   │   [Generate Button]         │  │
│   │                             │  │
│   └─────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### 2. Processus de Génération
```
Upload Image → Add Prompt → Generate
        ↓
Supabase Storage (original)
        ↓
Banana Pro API (génération)
        ↓
Supabase Storage (generated)
        ↓
Magnific AI (upscaling)
        ↓
Supabase Storage (final)
        ↓
Display to User + Notification
```

### 3. États de l'Interface
- **Idle** : Prêt à recevoir une image
- **Uploading** : Upload en cours
- **Processing** : Génération en cours (avec loader animé)
- **Completed** : Affichage du résultat
- **Error** : Gestion des erreurs avec message clair

---

## 🎨 Composants Clés

### ChatInterface
- Zone de drag & drop pour images
- Historique des conversations
- Preview des images uploadées
- Input pour le prompt
- Bouton de génération

### ImageUpload
- Drag & drop
- Validation du format (JPEG, PNG, WebP)
- Limitation de taille (max 10MB)
- Preview instantanée
- Crop/resize optionnel

### PromptInput
- Textarea avec suggestions
- Compteur de caractères
- Exemples de prompts
- Auto-completion intelligente

### ResultDisplay
- Comparaison avant/après (slider)
- Download haute qualité
- Partage social
- Sauvegarde dans la galerie

---

## 🔐 Authentification & Sécurité

### Supabase Auth
- Email/Password
- OAuth (Google, GitHub)
- Magic Links
- Row Level Security (RLS) activé

### Sécurité API
- Rate limiting
- Token validation
- Image validation côté serveur
- CORS configuré

---

## 💳 Système de Crédits

### Tiers
- **Free** : 5 crédits/mois
- **Pro** : 100 crédits/mois ($19/mois)
- **Enterprise** : Illimité ($99/mois)

### Consommation
- 1 crédit = 1 génération + upscaling

---

## 📊 Features MVP (Phase 1)

- [x] Définition du projet
- [ ] Setup Next.js + TypeScript
- [ ] Configuration Tailwind + Shadcn
- [ ] Configuration Supabase
- [ ] Configuration Vercel
- [ ] Landing page avec chat interface
- [ ] Upload d'images
- [ ] Intégration Banana Pro API
- [ ] Intégration Magnific AI API
- [ ] Système d'authentification
- [ ] Galerie de rendus utilisateur
- [ ] Système de crédits basique

---

## 🚀 Features Futures (Phase 2+)

### Phase 2
- Historique complet des rendus
- Paramètres avancés (style, intensité, etc.)
- Batch processing (plusieurs images à la fois)
- Templates de prompts prédéfinis

### Phase 3
- API publique pour développeurs
- Webhooks pour intégrations
- Collaboration (partage de rendus)
- Export en différents formats

### Phase 4
- Mobile app (React Native)
- Plugin Figma/Photoshop
- Marketplace de styles
- Fine-tuning de modèles personnalisés

---

## 🔧 Variables d'Environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Banana Pro API
BANANA_API_KEY=
BANANA_MODEL_KEY=

# Magnific AI
MAGNIFIC_API_KEY=

# Vercel
NEXT_PUBLIC_VERCEL_URL=

# Stripe (pour paiements futurs)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## 📝 Conventions de Code

### Naming
- Components : PascalCase
- Functions : camelCase
- Files : kebab-case
- CSS Classes : Tailwind utilities

### Structure
- Un composant par fichier
- Types dans fichiers `.types.ts`
- Utils dans `/lib/utils`
- Hooks personnalisés dans `/hooks`

### Git
- Branches : `feature/`, `fix/`, `hotfix/`
- Commits : Conventional Commits
- PR obligatoires pour main

---

## 📚 Documentation API

### POST /api/generate
```typescript
Request:
{
  imageUrl: string;
  prompt: string;
  userId: string;
}

Response:
{
  renderId: string;
  status: "processing";
  estimatedTime: number;
}
```

### GET /api/render/:id
```typescript
Response:
{
  id: string;
  status: "completed" | "processing" | "failed";
  originalImageUrl: string;
  generatedImageUrl?: string;
  upscaledImageUrl?: string;
  prompt: string;
  createdAt: string;
}
```

---

## 🎯 Métriques de Succès

### Technique
- Temps de génération < 30s
- Uptime > 99.5%
- Temps de chargement < 2s

### Business
- Taux de conversion Free → Pro : > 5%
- Satisfaction utilisateur : > 4.5/5
- Nombre de générations/jour : objectif 1000+

---

## 📞 Support & Maintenance

### Monitoring
- Vercel Analytics
- Supabase Metrics
- Sentry pour error tracking
- PostHog pour analytics produit

### Backups
- Supabase : backup quotidien automatique
- Images : réplication multi-région

---

## 🗓️ Timeline Estimée

- **Semaine 1** : Setup + Landing page
- **Semaine 2** : Intégrations API + Auth
- **Semaine 3** : Dashboard + Gallery
- **Semaine 4** : Tests + Polish + Deploy

---

## 📖 Ressources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Design Inspiration
- Vercel Design System
- Linear App
- Stripe Dashboard
- Figma Interface

---

**Dernière mise à jour** : 6 janvier 2026
**Version** : 1.0.0
**Statut** : En développement

