# 🎨 Configuration Google Vertex AI (Imagen)

## ⚠️ Prérequis

- Compte Google Cloud
- Carte bancaire (facturation requise, mais crédits gratuits disponibles)
- Plus complexe que Replicate

---

## 🚀 Configuration pas à pas

### 1️⃣ Créer un projet Google Cloud

1. Allez sur : https://console.cloud.google.com/
2. Créez un nouveau projet (ex: "renderz-app")
3. Activez la facturation (vous aurez $300 de crédits gratuits)

### 2️⃣ Activer l'API Vertex AI

1. Dans le projet, allez dans **"APIs & Services" > "Library"**
2. Cherchez **"Vertex AI API"**
3. Cliquez sur **"Enable"**

### 3️⃣ Créer une clé de service

1. Allez dans **"IAM & Admin" > "Service Accounts"**
2. Cliquez sur **"Create Service Account"**
3. Nom : "renderz-service"
4. Rôle : **"Vertex AI User"**
5. Cliquez sur **"Create Key"** → JSON
6. Téléchargez le fichier JSON

### 4️⃣ Configuration dans le projet

1. Renommez le fichier en `google-credentials.json`
2. Placez-le à la racine de votre projet Renderz
3. Ajoutez à `.gitignore` (déjà fait)

### 5️⃣ Installer les dépendances

```bash
npm install @google-cloud/aiplatform
```

### 6️⃣ Variables d'environnement

Ajoutez à `.env.local` :

```env
# Google Cloud Vertex AI
GOOGLE_CLOUD_PROJECT_ID=votre-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```

---

## 💰 Tarification Vertex AI / Imagen

### Crédits gratuits
- **$300** offerts pour nouveau compte Google Cloud
- Valable 90 jours

### Coût Imagen 2
- **$0.020** par image (1024x1024)
- **$0.030** par image (haute résolution)

### Coût Imagen 3
- **$0.040** par image (génération)
- **$0.080** par image (édition)

### Exemple
- 100 images Imagen 2 = **$2**
- 500 images Imagen 2 = **$10**
- Avec $300 de crédits = **15,000 images** 🎉

---

## 📋 Code d'intégration

Je peux créer un fichier `lib/api/vertex-imagen.ts` pour vous si vous confirmez vouloir utiliser Vertex AI.

Le code utilisera l'API officielle Google Cloud pour générer avec Imagen.

---

## ⚖️ Comparaison

| Feature | Replicate (Flux) | Vertex AI (Imagen) |
|---------|------------------|-------------------|
| **Setup** | Simple (1 token) | Complexe (Google Cloud) |
| **Gratuit** | Oui (crédits) | Oui ($300 crédits) |
| **Qualité** | Excellente | Excellente |
| **Vitesse** | ~4s | ~5-10s |
| **Prix** | $0.024/image | $0.020-$0.080/image |
| **Carte requise** | Non (au début) | Oui |

---

## 🤔 Ma recommandation

### Pour débuter rapidement : **Replicate** ⭐
- Configuration en 2 minutes
- Pas de carte bancaire au début
- Qualité comparable à Imagen
- Flux est très performant

### Pour Google à tout prix : **Vertex AI**
- Si vous avez déjà Google Cloud
- Si vous voulez absolument Imagen
- Si vous avez le temps de configurer

---

## 📞 Besoin d'aide ?

Dites-moi si vous voulez :
1. **Continuer avec Replicate** (simple et rapide)
2. **Configurer Vertex AI** (je crée le code pour Imagen)
3. **Les deux** (système hybride avec choix)

Je peux implémenter n'importe quelle option ! 🚀





