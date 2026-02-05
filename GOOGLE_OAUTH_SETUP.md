# 🔐 Configuration Google OAuth pour le développement local

## 📋 Étapes pour configurer Google OAuth

### 1️⃣ Créer un projet dans Google Cloud Console

1. Va sur : **https://console.cloud.google.com/**
2. Crée un nouveau projet ou sélectionne un projet existant
3. Nom du projet : **"Renderz"** (ou autre)

---

### 2️⃣ Activer l'API Google+ (OAuth 2.0)

1. Dans le menu ☰, va dans **APIs & Services** > **Library**
2. Cherche **"Google+ API"** ou **"Identity Toolkit API"**
3. Clique sur **Enable** (Activer)

---

### 3️⃣ Créer les identifiants OAuth

1. Va dans **APIs & Services** > **Credentials**
2. Clique sur **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Si c'est la première fois, configure l'écran de consentement OAuth :
   - **User Type** : External (ou Internal si tu es sur Google Workspace)
   - **App name** : Renderz
   - **User support email** : Ton email
   - **Developer contact** : Ton email
   - Clique sur **Save and Continue** jusqu'à la fin

4. Crée l'OAuth Client ID :
   - **Application type** : **Web application**
   - **Name** : Renderz Local (ou Renderz Dev)

5. **IMPORTANT** : Configure les **Authorized redirect URIs** :
   ```
   http://localhost:3000/api/auth/callback/google
   ```

6. Clique sur **Create**

7. **Copie les identifiants** :
   - **Client ID** (commence par `...apps.googleusercontent.com`)
   - **Client Secret** (clique sur "Show" pour le voir)

---

### 4️⃣ Ajouter les variables d'environnement

Ouvre ton fichier `.env.local` et ajoute :

```env
# Google OAuth (pour la connexion sociale)
GOOGLE_CLIENT_ID=ton_client_id_ici.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ton_client_secret_ici

# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=ton_secret_32_caracteres_ici

# Database URL Supabase (PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.aodlfljsneigkrmjnpai.supabase.co:5432/postgres
```

### Générer BETTER_AUTH_SECRET

```bash
openssl rand -base64 32
```

---

### 5️⃣ Vérifier la configuration

1. Redémarre ton serveur :
   ```bash
   npm run dev
   ```

2. Va sur http://localhost:3000
3. Clique sur "Sign in with Google"
4. Tu devrais être redirigé vers Google pour autoriser l'application

---

## 🐛 Problèmes courants

### Erreur : "redirect_uri_mismatch"

**Solution** : Vérifie que l'URL de redirection dans Google Cloud Console est exactement :
```
http://localhost:3000/api/auth/callback/google
```

### Erreur : "invalid_client"

**Solution** : Vérifie que `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont corrects dans `.env.local`

### Erreur : "access_denied"

**Solution** : Vérifie que l'écran de consentement OAuth est configuré et publié

### La connexion ne fonctionne pas

**Vérifications** :
1. ✅ `BETTER_AUTH_URL=http://localhost:3000` dans `.env.local`
2. ✅ `DATABASE_URL` est configuré et fonctionne
3. ✅ Les tables Better Auth sont créées dans Supabase
4. ✅ Le serveur a été redémarré après avoir ajouté les variables

---

## 🚀 Pour la production

Quand tu déploies en production, ajoute aussi l'URL de production dans Google Cloud Console :

**Authorized redirect URIs** :
```
http://localhost:3000/api/auth/callback/google
https://renderz.ch/api/auth/callback/google
https://www.renderz.ch/api/auth/callback/google
```

Et mets à jour les variables d'environnement sur Vercel :
- `BETTER_AUTH_URL=https://renderz.ch` (ou ton domaine)
- `GOOGLE_CLIENT_ID` (le même)
- `GOOGLE_CLIENT_SECRET` (le même)

---

## ✅ Checklist

- [ ] Projet créé dans Google Cloud Console
- [ ] API Google+ activée
- [ ] OAuth Client ID créé (type Web application)
- [ ] Redirect URI configuré : `http://localhost:3000/api/auth/callback/google`
- [ ] `GOOGLE_CLIENT_ID` ajouté dans `.env.local`
- [ ] `GOOGLE_CLIENT_SECRET` ajouté dans `.env.local`
- [ ] `BETTER_AUTH_URL=http://localhost:3000` dans `.env.local`
- [ ] `BETTER_AUTH_SECRET` généré et ajouté
- [ ] `DATABASE_URL` configuré
- [ ] Serveur redémarré
- [ ] Test de connexion Google effectué

---

✅ **Une fois tout configuré, la connexion Google devrait fonctionner !** 🎉



