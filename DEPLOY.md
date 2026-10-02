# Déploiement SIGNAL Platform

## Prérequis

- Node.js 18+
- Compte Supabase (supabase.com)
- Compte Vercel (vercel.com)
- Clé API Anthropic
- Projet Google Cloud (pour Calendar)

---

## 1. Supabase — Setup

### Créer le projet
1. Aller sur [supabase.com](https://supabase.com) → New project
2. Choisir un nom : `signal-platform`
3. Choisir la région la plus proche (Europe West pour la France/Afrique)

### Exécuter le schéma SQL
1. Dashboard Supabase → **SQL Editor**
2. Copier-coller le contenu de `supabase/schema.sql`
3. Cliquer **Run**

### Activer Google OAuth (optionnel)
1. Authentication → Providers → Google
2. Activer et entrer `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`
3. Redirect URL : `https://votre-domaine.vercel.app/auth/callback`

### Récupérer les clés
Dans **Settings → API** :
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
- `SUPABASE_SERVICE_ROLE_KEY` = service_role (secret)

---

## 2. Anthropic API

1. [console.anthropic.com](https://console.anthropic.com) → API Keys → Create
2. Copier la clé → `ANTHROPIC_API_KEY`

---

## 3. Google Cloud — Calendar API

1. [console.cloud.google.com](https://console.cloud.google.com) → Nouveau projet
2. APIs & Services → Enable APIs → chercher **Google Calendar API** → Enable
3. APIs & Services → Credentials → Create Credentials → **OAuth 2.0 Client ID**
   - Type : Web application
   - Authorized redirect URIs : `https://votre-domaine.vercel.app/api/auth/google/callback`
4. Copier :
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

---

## 4. Variables d'environnement

Copier `.env.local` et remplir :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

ANTHROPIC_API_KEY=sk-ant-...

GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=https://votre-domaine.vercel.app/api/auth/google/callback

NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
```

---

## 5. Déploiement Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Dans le dossier signal-platform
vercel

# Suivre les instructions, puis ajouter les env vars :
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GOOGLE_REDIRECT_URI
vercel env add NEXT_PUBLIC_APP_URL

# Re-déployer avec les env vars
vercel --prod
```

Ou via le dashboard Vercel :
1. Import Git repository → connecter votre repo GitHub
2. Settings → Environment Variables → ajouter toutes les variables
3. Redeploy

---

## 6. Après déploiement

### Mettre à jour les URLs Google
Dans Google Cloud Console → OAuth 2.0 Client :
- Ajouter l'URL Vercel réelle dans **Authorized redirect URIs**

### Mettre à jour Supabase
Dans Supabase → Authentication → URL Configuration :
- Site URL : `https://votre-domaine.vercel.app`
- Redirect URLs : `https://votre-domaine.vercel.app/auth/callback`

### Premier compte
Créer son compte via `/login` → Sign up

---

## Structure des données

```
profiles         → consultants SIGNAL
companies        → portefeuille clients
sessions         → sessions CEO (planning → analyse)
guide_questions  → 12 questions pré-chargées (B1-B4)
session_responses → réponses CEO par question (auto-save)
signals          → signaux extraits par Claude IA
outputs          → compte rendu, recommandations, brief table ronde
agenda_events    → sync Google Calendar
```

---

## Flux principal

```
1. Créer entreprise (/companies/new)
2. Planifier session (/sessions/new)
3. Conduire l'entretien CEO (/sessions/[id])
   → Réponses auto-sauvegardées par question
4. Lancer l'analyse IA (/sessions/[id]/process)
   → Claude extrait signaux + génère outputs en ~20s
5. Consulter les outputs (/sessions/[id]/outputs)
   → Compte rendu · Recommandations agents · Brief table ronde
6. Synchroniser Google Calendar (Settings → connecter)
```
