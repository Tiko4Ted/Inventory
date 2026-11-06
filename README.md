# Pharmacy Management System

Mobile-first pharmacy operations software for inventory control and family-planning follow-up.

The first delivery focuses on inventory: product records, stock movements, low-stock visibility,
expiry tracking, shelf-photo capture, AI-assisted suggestions, and a human verification step before
any AI result becomes an official stock record.

## Product direction

The system addresses pharmacies that rely on notebooks, spreadsheets, or memory to answer basic
operational questions:

- What products are available right now?
- How many units remain?
- What was received, dispensed, damaged, or adjusted?
- Which products are below the minimum level?
- Which products are approaching expiry?
- Can a staff member photograph a shelf and verify what the AI detected?
- Which family-planning clients should be reminded to return?

The application is designed for mobile use in a busy pharmacy, with short forms, clear stock status,
an explicit review step for AI capture, and an offline-ready client data layer for unreliable network
conditions.

## Current scope

### Inventory MVP

- Staff authentication boundary and role-based authorization boundary
- Inventory item records
- Quantity, unit, category, batch number, expiry date, and minimum-stock threshold
- Stock movement records for received, dispensed, damaged, expired, and manual adjustments
- Current stock and low-stock API endpoints
- Shelf-image upload flow using private object storage
- AI shelf-analysis service returning structured suggestions
- Review endpoint that requires user confirmation before committing suggestions
- Manual inventory entry flow in the mobile app
- Basic API health endpoint
- Audit-log schema for later implementation of a complete change history

### Planned follow-up module

Family-planning clients will be added after the inventory workflow is validated. That module will
record the service date, method, recommended return date, consent/preferences, and reminder status.
SMS sending will be scheduled by a daily job and will require a provisioned messaging provider.

## Architecture

```text
Expo mobile app
        |
        | HTTPS JSON API
        v
Next.js App Router API on Node.js / Vercel
        |
        +--> PostgreSQL + Drizzle ORM       inventory and audit data
        +--> Private Blob storage            shelf photos
        +--> Vercel AI Gateway + AI SDK      structured shelf suggestions
        +--> SMS provider                   future client reminders
```

The repository is a pnpm monorepo:

- `apps/mobile` contains the Expo React Native application.
- `apps/api` contains the Next.js API and a small web status page.
- `packages/database` contains the Drizzle schema and migration configuration.
- `packages/shared` contains shared validation, types, and constants.

## Technology choices

- Expo + React Native + TypeScript
- Expo Router for file-based mobile navigation
- Next.js App Router with Node.js route handlers
- PostgreSQL for relational inventory and client records
- Drizzle ORM for type-safe SQL and low runtime overhead
- TanStack Query for client data fetching and cache invalidation
- React Hook Form and Zod for safe, compact forms
- Vercel Blob for private shelf-photo storage
- Vercel AI SDK through the AI Gateway for structured vision output
- Vercel Cron for the first reminder scheduler
- EAS Build for Android and iOS packaging

## Repository structure

```text
apps/
  api/                  Next.js backend and API route handlers
  mobile/               Expo mobile application
packages/
  database/             Drizzle schema and migrations
  shared/               Shared TypeScript types and Zod schemas
docs/                   Product and workflow documentation
```

## Prerequisites

- Node.js 22 or newer
- pnpm 10 or newer
- Expo Go for local mobile testing, or an Android/iOS development build
- A PostgreSQL database for real persistence
- A Vercel account for deployment and Marketplace integrations
- Git and access to the target GitHub repository

The Vercel CLI is recommended for integration provisioning, environment management, deployment,
and logs:

```bash
npm i -g vercel
vercel login
```

## Install dependencies

```bash
pnpm install
```

Copy the environment template for the API:

```bash
Copy-Item .env.example apps/api/.env.local
```

For PowerShell, edit `apps/api/.env.local` and provide the real values. Never commit secrets.

## Provisioning real services

The app intentionally does not ship fake database, AI, or SMS fallbacks. Production services must
be provisioned before those workflows are enabled.

### Discover Marketplace categories

```bash
vercel integration categories
vercel integration discover --category storage
vercel integration discover --category messaging
vercel integration discover --category ai
```

The database/storage choice should be a relational PostgreSQL service. The messaging integration
must support SMS delivery in the countries where the pharmacy operates. After installing an
integration, pull its environment variables:

```bash
vercel env pull --yes apps/api/.env.local
```

For AI, inspect the current model list before setting `AI_MODEL`:

```bash
curl https://ai-gateway.vercel.sh/v1/models
```

Use a current vision-capable `provider/model` string. Do not copy an old model identifier from an
example or hard-code provider API keys in source code.

## Database setup

Once `DATABASE_URL` is available:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

The initial schema includes:

- `inventory_items`
- `stock_movements`
- `shelf_scans`
- `shelf_scan_lines`
- `audit_logs`

All stock changes should be represented by a movement. The `current_quantity` value is a fast
read-model and should be reconciled against movement history during audits.

## Run locally

Start the API:

```bash
pnpm dev:api
```

The API runs at `http://localhost:3000`.

Start the mobile app in another terminal:

```bash
pnpm dev:mobile
```

Set `EXPO_PUBLIC_API_URL` to an address reachable from the phone. A physical phone cannot normally
reach the computer through `localhost`; use the computer's LAN address or Expo tunnel when needed.

## Inventory workflow

### Manual entry

1. Staff opens Inventory.
2. Staff selects Add item.
3. Staff enters the product name, unit, quantity, minimum level, batch, and expiry date.
4. The API creates the item and its opening stock movement.
5. The item appears with an in-stock, low-stock, or out-of-stock status.

### Shelf-photo capture

1. Staff captures a shelf image in the mobile app.
2. The image is uploaded directly to private Blob storage.
3. The API creates a pending shelf scan.
4. The AI service returns structured product suggestions with confidence values.
5. Staff verifies, edits, or rejects every suggested line.
6. Only approved lines are committed as inventory changes.
7. The scan and review actions are retained for auditability.

AI is an assistant, not an authority. It must not silently change stock quantities.

## API endpoints

### Health

- `GET /api/health`

### Inventory

- `GET /api/inventory/items`
- `POST /api/inventory/items`
- `GET /api/inventory/items/:id`
- `PATCH /api/inventory/items/:id`
- `POST /api/inventory/movements`
- `GET /api/inventory/alerts`

### Shelf scans

- `POST /api/uploads`
- `POST /api/inventory/shelf-scans`
- `GET /api/inventory/shelf-scans/:id`
- `POST /api/inventory/shelf-scans/:id/review`

### Scheduled jobs

- `GET /api/jobs/reminders`

The reminder endpoint is reserved for the family-planning module and must be protected with a
deployment-specific cron secret before production use.

## Security requirements

Before production:

1. Provision managed authentication and disable `ALLOW_LOCAL_DEV_AUTH`.
2. Add pharmacy-level tenancy to every query.
3. Enforce staff roles: owner, manager, pharmacist, and stock clerk.
4. Protect private shelf images with authenticated access or short-lived signed URLs.
5. Add a cron secret to the reminder route.
6. Keep client health data minimal and collect only what is needed for follow-up.
7. Record consent and opt-out state for SMS reminders.
8. Add audit events for reads and writes of sensitive client records.
9. Define photo and client-record retention periods.
10. Review local health-data, privacy, and SMS regulations before launch.

## Quality checks

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

## Deployment

The API is deployable as a Next.js project on Vercel. Link the repository explicitly after the
GitHub remote is configured, then verify the project before deployment:

```bash
vercel link --repo
vercel project inspect --non-interactive
vercel deploy
```

The mobile application is built with EAS:

```bash
pnpm --filter @pharmacy/mobile exec expo start
pnpm --filter @pharmacy/mobile exec eas build:configure
pnpm --filter @pharmacy/mobile exec eas build --platform android
```

## Git workflow

```bash
git add .
git commit -m "Initial pharmacy inventory platform"
git branch -M main
git remote add origin https://github.com/Tiko4Ted/Inventory.git
git push -u origin main
```

If `origin` already exists, update it instead of adding a duplicate remote:

```bash
git remote set-url origin https://github.com/Tiko4Ted/Inventory.git
```

## Important limitations in this first commit

- Provider credentials are intentionally not embedded.
- Marketplace integrations cannot be provisioned until the Vercel account is authenticated and
  the target project is linked.
- The mobile app provides the inventory navigation and capture/review surfaces; final device
  permissions and production upload testing require an Expo development build.
- Family-planning records and live SMS sending are represented as documented extension points, not
  enabled against real client data yet.
