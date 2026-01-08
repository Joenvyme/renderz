# 🔐 Configuration Better Auth

## 1. Variables d'environnement

Ajoutez ces variables à votre fichier `.env.local` :

```bash
# Better Auth
BETTER_AUTH_SECRET=votre_secret_genere_aleatoirement_32_caracteres
BETTER_AUTH_URL=http://localhost:3000

# Database URL Supabase (PostgreSQL)
# Trouvez-le dans : Supabase Dashboard > Project Settings > Database > Connection string
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# App URL (pour le client)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Vercel Blob (pour l'upload de photos de profil)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

### Générer un secret

Vous pouvez générer un secret avec cette commande :
```bash
openssl rand -base64 32
```

### Trouver votre DATABASE_URL Supabase

1. Allez dans votre projet Supabase
2. Project Settings > Database
3. Copiez la "Connection string" (URI)
4. Remplacez `[YOUR-PASSWORD]` par votre mot de passe de base de données

### Obtenir un BLOB_READ_WRITE_TOKEN (Vercel Blob)

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet (ou créez-en un)
3. Storage > Create Database > Blob
4. Une fois créé, copiez le `BLOB_READ_WRITE_TOKEN` dans les variables d'environnement

## 2. Créer les tables dans Supabase

Better Auth a besoin de tables pour stocker les utilisateurs et sessions.

### Option A : Via CLI Better Auth (Recommandé)

```bash
npx @better-auth/cli migrate
```

Cette commande créera automatiquement les tables nécessaires.

### Option B : Manuellement dans Supabase

Si le CLI ne fonctionne pas, créez ces tables dans l'éditeur SQL de Supabase :

```sql
-- Table utilisateurs
CREATE TABLE IF NOT EXISTS "user" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN DEFAULT FALSE,
    "image" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Table sessions
CREATE TABLE IF NOT EXISTS "session" (
    "id" TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMP NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

-- Table accounts (pour les comptes liés)
CREATE TABLE IF NOT EXISTS "account" (
    "id" TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP,
    "refreshTokenExpiresAt" TIMESTAMP,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Table verification (pour les tokens de vérification email)
CREATE TABLE IF NOT EXISTS "verification" (
    "id" TEXT PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId");
```

## 3. Tester l'authentification

1. Lancez l'app : `npm run dev`
2. Allez sur http://localhost:3000
3. Cliquez sur "SE CONNECTER" dans le header
4. Créez un compte avec email/mot de passe
5. Une fois connecté, vous pourrez générer des rendus !

## 4. Fonctionnement

- **Sans authentification** : L'utilisateur peut voir la landing page et uploader une image, mais doit se connecter pour générer
- **Avec authentification** : L'utilisateur peut générer des rendus

## 5. Structure des fichiers

```
lib/
  auth.ts          # Configuration serveur Better Auth
  auth-client.ts   # Client Better Auth (React hooks)
app/
  api/auth/[...all]/route.ts  # Route API Better Auth
components/
  auth-modal.tsx   # Modal de connexion/inscription
```

