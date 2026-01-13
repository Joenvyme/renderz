# 💳 Activer la facturation Google Cloud pour Nano Banana

## 🎯 Objectif

Activer la facturation sur votre projet Google Cloud pour débloquer Nano Banana (gemini-2.5-flash-image).

---

## 🚀 Étapes détaillées

### 1️⃣ Aller sur Google Cloud Console

1. Ouvrez : **https://console.cloud.google.com/**
2. Connectez-vous avec votre compte Google (celui utilisé pour l'API Key)

---

### 2️⃣ Sélectionner ou créer un projet

#### Si vous avez déjà un projet :
1. Cliquez sur le sélecteur de projet en haut
2. Sélectionnez votre projet existant

#### Si vous devez créer un projet :
1. Cliquez sur **"Sélectionner un projet"** en haut
2. Cliquez sur **"Nouveau projet"**
3. Nom : **"renderz-app"** (ou autre)
4. Cliquez sur **"Créer"**

---

### 3️⃣ Activer la facturation

#### Option A : Via le menu Facturation

1. Dans le menu ☰ (hamburger) en haut à gauche
2. Allez dans **"Facturation"** (Billing)
3. Si vous voyez "Ce projet n'a pas de compte de facturation" :
   - Cliquez sur **"Associer un compte de facturation"**
   - Ou **"Créer un compte"**

#### Option B : Lien direct

Allez sur : **https://console.cloud.google.com/billing**

---

### 4️⃣ Créer un compte de facturation

1. Cliquez sur **"Créer un compte"** ou **"Add billing account"**
2. Remplissez les informations :
   - **Type de compte** : Individuel (ou Professionnel)
   - **Pays** : Votre pays
   - **Nom** : Votre nom ou nom d'entreprise
3. Cliquez sur **"Continuer"**

---

### 5️⃣ Ajouter une carte bancaire

1. Entrez les informations de votre carte :
   - Numéro de carte
   - Date d'expiration
   - CVV
   - Adresse de facturation
2. **Important** : Google demande une carte pour vérification, mais vous aurez :
   - **$300 de crédits gratuits** pour 90 jours
   - Pas de débit automatique (sauf si vous dépassez)
3. Cliquez sur **"Démarrer mon essai gratuit"**

---

### 6️⃣ Lier le compte de facturation au projet

1. Retournez sur : **https://console.cloud.google.com/billing**
2. Sélectionnez votre compte de facturation
3. Cliquez sur **"Associer des projets"** ou **"Link a project"**
4. Sélectionnez votre projet (renderz-app)
5. Cliquez sur **"Définir le compte"**

---

### 7️⃣ Activer l'API Gemini

1. Allez sur : **https://console.cloud.google.com/apis/library**
2. Cherchez **"Generative Language API"**
3. Cliquez sur **"Activer"** (Enable)
4. Attendez quelques secondes

---

### 8️⃣ Vérifier les quotas

1. Allez sur : **https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas**
2. Cherchez **"gemini-2.5-flash-image"** ou **"generate_content"**
3. Vérifiez que les limites ne sont plus à 0
4. Si les limites sont encore à 0, attendez quelques minutes (propagation)

---

### 9️⃣ Créer une nouvelle clé API (recommandé)

1. Allez sur : **https://console.cloud.google.com/apis/credentials**
2. Cliquez sur **"Créer des identifiants"** → **"Clé API"**
3. Une nouvelle clé est générée
4. Cliquez sur **"Restreindre la clé"** (recommandé)
5. Dans **"Restrictions d'API"** :
   - Sélectionnez **"Restreindre la clé"**
   - Cochez **"Generative Language API"**
6. Cliquez sur **"Enregistrer"**
7. **Copiez cette nouvelle clé**

---

### 🔟 Mettre à jour votre `.env.local`

Remplacez votre ancienne clé par la nouvelle :

```env
# Nouvelle clé avec facturation activée
GOOGLE_GEMINI_API_KEY=AIzaSy...NOUVELLE_CLE_ICI

# Mode production
MOCK_MODE=false
```

---

## 💰 Tarification

### Crédits gratuits
- **$300** offerts pour 90 jours
- Pas de débit tant que vous ne dépassez pas
- Amplement suffisant pour tester et développer

### Coût Nano Banana (après crédits)
- **Gemini 2.5 Flash Image** : ~$0.02 par image
- **1290 tokens** par image 1024x1024

### Calcul d'exemple
Avec $300 de crédits gratuits :
- **15,000 images** à $0.02 = $300
- Largement suffisant pour développer !

---

## ✅ Test après activation

1. **Redémarrez** le serveur Next.js
   ```bash
   npm run dev
   ```

2. **Attendez 2-5 minutes** (propagation des changements)

3. **Testez** un rendu sur http://localhost:3000

4. **Surveillez les logs** :
   ```
   [uuid] Starting Nano Banana generation...
   ✓ Image generated successfully!
   ```

---

## 🐛 Troubleshooting

### Erreur : "Quota still 0"
→ Attendez 5-10 minutes pour la propagation
→ Vérifiez que la facturation est bien active
→ Créez une nouvelle clé API

### Erreur : "Billing not enabled"
→ Retournez sur https://console.cloud.google.com/billing
→ Vérifiez que le projet est bien lié au compte de facturation

### Erreur : "API not enabled"
→ Activez "Generative Language API" dans la console
→ https://console.cloud.google.com/apis/library

### Carte bancaire refusée
→ Google accepte Visa, Mastercard, American Express
→ Vérifiez avec votre banque
→ Utilisez une carte de crédit plutôt que débit

---

## 📊 Surveiller l'utilisation

### Voir vos crédits gratuits restants
**https://console.cloud.google.com/billing**

### Voir l'utilisation de l'API
**https://console.cloud.google.com/apis/dashboard**

### Définir des alertes de budget
1. Allez sur : https://console.cloud.google.com/billing/budgets
2. Cliquez sur **"Créer un budget"**
3. Définissez un montant (ex: $50)
4. Vous serez alerté par email

---

## 🎉 C'est fait !

Une fois la facturation activée et la clé API mise à jour :

- ✅ Nano Banana débloqué
- ✅ $300 de crédits gratuits
- ✅ Génération d'images hyperréalistes
- ✅ Qualité professionnelle Google

**Lancez votre premier rendu !** 🍌✨

---

## 📞 Liens utiles

- **Console Cloud** : https://console.cloud.google.com/
- **Facturation** : https://console.cloud.google.com/billing
- **APIs** : https://console.cloud.google.com/apis
- **Quotas** : https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
- **Tarification Gemini** : https://ai.google.dev/pricing

---

**Temps estimé** : 5-10 minutes  
**Coût** : $0 (crédits gratuits $300 pendant 90 jours)





