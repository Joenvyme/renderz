# Abonnements et tarification — RENDERZ

Document de référence pour les **formules**, les **quotas**, les **prix** (CHF) et le **raccordement Stripe**. À mettre à jour quand les montants ou les règles métier changent.

---

## Modèle Enterprise (équipe)

**Oui, c’est un schéma standard** et compatible avec une bonne intégration Stripe :

- **Un abonnement** = une **organisation / équipe** (en base : ex. table `organization` ou `team`).
- **Un utilisateur** est désigné comme **contact principal** (`billing_owner` / `owner`) : c’est lui qui **souscrit**, dont la carte est facturée et qui **reçoit les factures** (email Stripe + PDF).
- Les **autres membres** sont invités sur le compte équipe : ils consomment le **même pool de quotas** (rendus / animations / upscales partagés), sans facturation individuelle.

**Côté Stripe (approche courante)** : un **Customer** Stripe = l’organisation (email de facturation = contact principal). Les **Price** restent des abonnements classiques ; la gestion des **sièges** « illimités » est **dans votre app** (invitations), pas besoin d’un prix par siège si vous ne facturez pas au membre.

**À prévoir côté produit** : rôles (owner, admin, membre), transfert du rôle « contact facturation », révocation des accès, et CGU sur la responsabilité du payeur.

---

## 1. Formules d’abonnement (récurrent)

Les quotas sont exprimés **par période de facturation** (mois ou an). Le **gratuit** utilise la même **période mensuelle UTC** (`YYYY-MM`) que le compteur `usage_monthly`.

| Formule | `subscription_tier` | Prix (CHF) | Période | Quotas inclus |
|--------|---------------------|------------|---------|----------------|
| **Gratuit** | `free` | **0** | — | **5** créations **par mois civil UTC** (images + animations dans un **compteur combiné**). **1 upscale** (Magnific) **par mois** (même période UTC). |
| **Pro** | `pro` | **60** | Mensuel | **100** rendus, **100** animations, **25** upscales (Magnific) **par mois**. |
| **Pro** | `pro` | **648** (= 60 × 12 × 0,9) | Annuel (**−10 %** vs 12 mois au tarif mensuel) | **Mêmes quotas mensuels** : 100 / 100 / 25 **par mois** (pas un pool annuel unique, sauf décision produit). |
| **Enterprise** | `enterprise` | **450** | Mensuel | **Équipe** : utilisateurs **illimités** (invitation), **pool partagé** : **1000** rendus, **250** animations, **100** upscales **par mois**. |
| **Enterprise** | `enterprise` | **4860** (= 450 × 12 × 0,9) | Annuel (**−10 %**) | Idem : quotas **mensuels** 1000 / 250 / 100 **par mois**. |

**Remarque prix annuel** : −10 % = facturation **12 × prix mensuel × 0,9** (équivalent à **10 % de remise** sur la somme des 12 mois). Vérifier l’arrondi commercial (648 CHF / an pour Pro, 4860 CHF / an pour Enterprise).

---

## 2. Clarifications produit (à trancher)

| Sujet | Proposition |
|--------|-------------|
| **Gratuit — créations** | **5 par mois civil UTC**, compteur combiné rendus + animations (`usage_monthly` pour le palier `free`). |
| **Gratuit — upscale** | **1 upscale Magnific par mois civil UTC** (`usage_monthly.upscales_used`), indépendamment des 5 créations. |
| **Rendu vs animation** | Deux compteurs séparés (100 + 100) : un utilisateur peut épuiser les animations avant les rendus, etc. |
| **Reset des quotas** | Aligner le **cycle** sur la date de souscription Stripe ou **début de mois civil** (plus simple à expliquer, un peu plus technique côté cron). |
| **Dépassement** | Soft limit (bloquer) vs achat de packs vs passage Pro — à définir. |

---

## 3. Consommation côté application

Trois **compteurs** (ou équivalent en « crédits » avec poids différents) :

| Action | Compteur débité |
|--------|-----------------|
| Image / rendu (génération image) | Quota **rendus** |
| Animation / vidéo | Quota **animations** |
| Upscale Magnific (4K, etc.) | Quota **upscales** |

Échec **imputable au service** (timeout, erreur 5xx) : ne pas débiter (politique à documenter).

---

## 4. Prix de revient API (indicatif — **à recalculer avec vos factures réelles**)

Les coûts réels dépendent des **tarifs Google AI / Replicate / Magnific** au moment T, de la **résolution**, de la **durée vidéo**, et des **optimisations** (cache, batch).

**Hypothèses de travail (ordre de grandeur)** — à remplacer par vos chiffres :

| Poste | Hypothèse indicative | Ordre de grandeur mensuel **Pro** (100 + 100 + 25) |
|--------|----------------------|---------------------------------------------------|
| Rendu image | ~0,02 USD / image (doc interne type Gemini Flash Image) | ~2 USD |
| Animation | **Très variable** (durée, modèle) — ex. 0,05–0,30 USD / unité si court | ~5–30 USD |
| Upscale Magnific | **Variable** (API Freepik / Magnific) — budget prudence | ~quelques USD à dizaines USD pour 25 |

**Pro CHF 60 / mois** : marge souvent **correcte** si le coût vidéo reste maîtrisé (durée plafonnée, résolution bornée). **À valider** en mesurant le **coût moyen par animation** sur 1–2 semaines de prod.

**Enterprise CHF 450 / mois** (1000 + 250 + 100) : volume ~5× à 6× le Pro sur les images ; vérifier que le **pic d’usage** (toute l’équipe le même mois) ne fait pas exploser la facture fournisseur. Pistes : **fair use**, plafond de durée vidéo par animation, ou **overage** au-delà du pool.

---

## 5. Améliorations possibles (produit & technique)

1. **Plafonds techniques** : durée max par animation, résolution max, file d’attente prioritaire Pro vs Free — réduit le risque sur le coût variable.
2. **Alertes** : à 80 % / 100 % des quotas, email au contact principal (Enterprise) ou à l’utilisateur (Pro).
3. **Facturation Enterprise** : mentionner sur le devis / CGU que le **payeur** est responsable du paiement pour toute l’équipe.
4. **Stripe** : Customer metadata `organization_id`, `billing_owner_user_id` ; webhooks pour aligner quotas sur la période de facturation.
5. **Cas limite** : utilisateur Pro invite-t-il quelqu’un ? Non — invitations **réservées Enterprise** pour éviter la confusion (siège unique Pro).

---

## 6. Packs de crédits (optionnel, hors abonnement)

Si vous vendez des recharges ponctuelles en plus des formules ci-dessus :

| Pack | Contenu | Prix | Stripe Price ID |
|------|---------|------|-----------------|
| *À définir* | | | `price_…` |

---

## 7. Correspondance Stripe (à remplir dans le Dashboard)

| Élément | Mode test | Mode production |
|---------|-----------|-------------------|
| Pro — mensuel (60 CHF) | `price_…` | `price_…` |
| Pro — annuel (648 CHF, −10 %) | `price_…` | `price_…` |
| Enterprise — mensuel (450 CHF) | `price_…` | `price_…` |
| Enterprise — annuel (4860 CHF, −10 %) | `price_…` | `price_…` |

**Variables d’environnement** (exemples) :

- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY`
- `STRIPE_PRICE_ENTERPRISE_MONTHLY`
- `STRIPE_PRICE_ENTERPRISE_YEARLY`

---

## 8. Ce que ce document ne remplace pas

- **CGV** : résiliation, remboursement, TVA, facturation B2B.
- **Implémentation** : tables `organization`, membres, webhooks Stripe, application des quotas.

---

## 9. Mise en place technique (implémentée dans le repo)

Référence officielle : [Build a pre-built subscription page with Stripe Checkout](https://docs.stripe.com/billing/quickstart) (Billing + Checkout hébergé + webhooks + portail client).

1. **SQL** : exécuter `supabase/migrations/20260328120000_billing_and_usage.sql` dans le SQL Editor Supabase (ou votre chaîne de migrations).
2. **Variables d’environnement** (Vercel + `.env.local`) :
   - `STRIPE_SECRET_KEY` — clé secrète (test ou live).
   - `STRIPE_WEBHOOK_SECRET` — secret du webhook (différent en local avec Stripe CLI).
   - `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `STRIPE_PRICE_ENTERPRISE_MONTHLY`, `STRIPE_PRICE_ENTERPRISE_YEARLY` — soit un ID **`price_…`**, soit une **lookup key** définie sur le Price dans Stripe (comme dans le quickstart). Modèle à copier : **`stripe.env.example`** à la racine du dépôt.
   - `NEXT_PUBLIC_APP_URL` — URL publique du site (ex. `https://renderz.ch`) pour les redirections Checkout / portail.
   - Optionnel : `BILLING_UNLIMITED_EMAILS` — emails (séparés par des virgules) sans quota (usage interne).
3. **Flux Checkout** : `POST /api/stripe/checkout` crée une **Checkout Session** (`mode: subscription`), `billing_address_collection: auto`, `success_url` avec `{CHECKOUT_SESSION_ID}` ; métadonnées `checkoutPlan` pour le palier même avec lookup keys.
4. **Après redirection** : `GET /api/stripe/session?session_id=cs_…` vérifie la session (utilisateur connecté = `metadata.userId`) — aligné sur le quickstart.
5. **Webhook Stripe** : URL de production `https://<domaine>/api/webhooks/stripe` — événements au minimum : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
6. **Local** : `stripe listen --forward-to localhost:3000/api/webhooks/stripe` puis copier le `whsec_…` dans `STRIPE_WEBHOOK_SECRET`.

---

## 10. Journal des changements

| Date | Changement |
|------|------------|
| 2026-03-27 | Création du document |
| 2026-03-27 | Gratuit / Pro / Enterprise : quotas, CHF, remise annuelle 10 %, modèle équipe + contact facturation, prix de revient indicatif |
| 2026-03-28 | Section mise en place : migration, env, webhooks ; quotas appliqués côté API (`/api/generate`, `/api/video`, `/api/upscale`) |
