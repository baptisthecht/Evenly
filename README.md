# Evoly — La billetterie honnête

> SaaS de billetterie événementielle transparent. Alternative à Eventbrite.

## Stack

- **Framework** : Next.js 15 App Router (fullstack)
- **Monorepo** : Turborepo + pnpm workspaces
- **Base de données** : PostgreSQL + Prisma ORM
- **Auth** : NextAuth.js v5
- **Paiement** : Stripe Connect Express + Stripe Billing
- **Email** : Resend + React Email

## Démarrage rapide

### 1. Prérequis

- Node.js 20+
- pnpm 9+
- PostgreSQL (local ou Docker)

### 2. Installation

```bash
# Cloner le repo
git clone git@github.com:baptisthecht/Evoly.git
cd Evoly

# Installer les dépendances
pnpm install

# Copier et remplir les variables d'environnement
cp apps/app/.env.example apps/app/.env
# Éditer apps/app/.env avec vos valeurs
```

### 3. Base de données

```bash
# Créer et migrer la DB
pnpm db:migrate

# Seed les plans (Free et Pro)
pnpm --filter @evoly/db seed

# Optionnel : ouvrir Prisma Studio
pnpm db:studio
```

### 4. Démarrage

```bash
pnpm dev
```

Apps disponibles :
- `http://localhost:3001` — Dashboard app (`apps/app`)
- `http://localhost:3000` — Landing page (`apps/web`)
- `http://localhost:3002` — Scanner PWA (`apps/scanner`)

## Structure

```
evoly/
├── apps/
│   ├── app/          → app.evoly.com (dashboard + billetterie)
│   ├── web/          → evoly.com (landing marketing)
│   └── scanner/      → scanner.evoly.com (PWA check-in)
└── packages/
    ├── db/           → Prisma schema + client singleton
    ├── core/         → Business logic pure (framework-agnostic)
    ├── ui/           → Composants React partagés
    ├── email/        → Templates React Email
    └── config/       → tsconfig, eslint partagés
```

## Commandes utiles

```bash
pnpm dev              # Lance tous les apps
pnpm build            # Build tous les packages
pnpm db:migrate       # Migrations Prisma
pnpm db:studio        # Prisma Studio
pnpm db:generate      # Régénère le client Prisma
```

## Variables d'environnement

Voir `apps/app/.env.example` pour la liste complète.

Variables requises :
- `DATABASE_URL` — Connection string PostgreSQL
- `NEXTAUTH_URL` — URL de l'app (http://localhost:3001 en dev)
- `NEXTAUTH_SECRET` — Secret aléatoire (générer avec `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — OAuth Google
- `STRIPE_SECRET_KEY` — Stripe secret key
- `RESEND_API_KEY` — Resend API key

## Phases de développement

Voir section 16 du CDC (`docs/cdc.md`) pour l'ordre recommandé.

- ✅ Phase 1 — Fondations (monorepo, DB, core, UI)
- ✅ Phase 2 — Auth & Onboarding (NextAuth v5, 3 étapes)
- 🔄 Phase 3 — Core organisateur (événements, tickets)
- ⏳ Phase 4 — Billetterie publique
- ⏳ Phase 5 — Paiements & Finances
- ⏳ Phase 6 — Features avancées
- ⏳ Phase 7 — Go to market
