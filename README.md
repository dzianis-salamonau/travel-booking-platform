# Travel Booking Platform

A production-style travel aggregation and booking platform. It syncs packages, destinations, hotels, pricing, and availability from external providers, exposes fast local search, and validates availability with the provider before confirming a booking.

Built as a reference architecture for multi-provider travel integrations with NestJS, Next.js, PostgreSQL, Redis, and BullMQ.

## Features

- **Multi-provider sync** — Background jobs keep destinations, hotels, packages, and availability up to date
- **Fast search** — Filter by destination, airport, dates, price, rating, board type, and more
- **Booking flow** — Availability check, reservation, payment, and confirmation
- **Pricing engine** — Configurable commission and deposit rules
- **Admin panel** — Provider management, sync monitoring, and booking oversight
- **AI assistant** — Optional natural-language search and travel summaries (OpenAI)
- **Deployment ready** — Docker Compose and Kubernetes manifests included

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Backend | NestJS, TypeScript, Prisma, PostgreSQL, Redis, BullMQ |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Infrastructure | Docker, Kubernetes, GitHub Actions |
| AI | OpenAI API (optional) |

## Architecture

```
Provider APIs → Sync Workers → PostgreSQL → Search API → Next.js Frontend
                                      ↓
                              Availability check → Booking → Payment
```

Search runs against the local database for speed. Before a reservation is created, the backend re-checks availability and price with the provider.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Docker](https://www.docker.com/) (optional, for containerized setup)

## Quick Start (Docker)

```bash
git clone https://github.com/dzianis-salamonau/travel-booking-platform.git
cd travel-booking-platform
docker compose -f infrastructure/docker/docker-compose.yml up --build
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| API | http://localhost:3001/api |
| Swagger docs | http://localhost:3001/api/docs |

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL and Redis

```bash
docker compose -f infrastructure/docker/docker-compose.yml up postgres redis -d
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` if needed. Defaults work for local development.

### 4. Set up the database

```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Start the dev servers

```bash
pnpm dev
```

This starts the API (port 3001) and frontend (port 3000) via Turborepo.

## Environment Variables

See [`.env.example`](.env.example) for all options. Key variables:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for access tokens — **change in production** |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens — **change in production** |
| `CORS_ORIGIN` | Allowed frontend origin |
| `NEXT_PUBLIC_API_URL` | API URL used by the frontend |
| `AI_ENABLED` | Set to `true` to enable AI features |
| `OPENAI_API_KEY` | Required when AI is enabled |

Never commit `.env` files or real secrets to the repository.

## Demo Accounts

After seeding the database:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@travel.com` | `admin123` |
| Customer | `customer@travel.com` | `customer123` |

Seed data includes mock travel providers with sample destinations and packages.

## Project Structure

```
apps/
  backend/          NestJS API, Prisma, sync workers
  frontend/         Next.js web app
packages/
  provider-sdk/     Provider adapter interface and mock providers
  shared-types/     Shared TypeScript types
infrastructure/
  docker/           Docker Compose and Dockerfiles
  kubernetes/       K8s manifests
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm test` | Run tests |
| `pnpm lint` | Type-check all packages |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed the database with demo data |

## API Documentation

With the API running, open [http://localhost:3001/api/docs](http://localhost:3001/api/docs) for interactive Swagger documentation.

## CI

GitHub Actions runs lint, build, test, and Docker image builds on push and pull requests to `main` / `master`. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Before Publishing to GitHub

- Copy `.env.example` to `.env` locally — do not commit `.env`
- Replace default JWT secrets and database credentials in production
- Review `infrastructure/kubernetes/secret.yaml` — use real secrets management in production, not committed values
- Add a license file if you want to specify usage terms (none is included by default)

## License

No license has been specified yet. Add a `LICENSE` file before publishing if you want to define how others may use this code.
