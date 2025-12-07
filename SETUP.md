# P2P Gear Rental - Complete Setup Guide

This guide will walk you through setting up the P2P Gear Rental platform from scratch.

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** (recommend 20 LTS)
- **Docker & Docker Compose** (for database/Redis)
- **Git**

## Quick Start (5 Minutes)

```bash
# 1. Clone and install
git clone <repository-url>
cd p2p-gear-rental
npm install

# 2. Start infrastructure (PostgreSQL + Redis)
npm run docker:dev

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials (see below)

# 4. Initialize database
npm run prisma:migrate
npm run prisma:generate
npm run db:seed

# 5. Start development server
npm run dev
```

Open http://localhost:3000

---

## Step-by-Step Setup

### Step 1: Clone & Install Dependencies

```bash
git clone <repository-url>
cd p2p-gear-rental
npm install
```

### Step 2: Start Database & Redis

**Option A: Docker (Recommended)**
```bash
npm run docker:dev
```

This starts:
- PostgreSQL 15 on port 5432
- Redis 7 on port 6379

**Option B: Local PostgreSQL**
```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15
createdb p2p_gear_rental

# Ubuntu/Debian
sudo apt install postgresql-15
sudo systemctl start postgresql
sudo -u postgres createdb p2p_gear_rental
```

**Option C: Cloud Database**
- Use [Supabase](https://supabase.com) (recommended - also provides auth)
- Use [Neon](https://neon.tech) or [Railway](https://railway.app)

### Step 3: Configure Environment Variables

Copy the example file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with these required values:

```env
# Database (required)
DATABASE_URL="postgresql://username:password@localhost:5432/p2p_gear_rental?schema=public"

# Supabase Authentication (required)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Stripe Payments (required for payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Redis (optional - gracefully degrades)
REDIS_URL="redis://localhost:6379"
```

### Step 4: Set Up Supabase (Authentication)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings > API**
4. Copy your:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Configure Auth Settings:**
1. Go to **Authentication > Providers**
2. Enable **Email** provider
3. (Optional) Enable Google, GitHub, etc.

### Step 5: Set Up Stripe (Payments)

1. Create account at [stripe.com](https://stripe.com)
2. Go to **Developers > API Keys**
3. Copy your test keys:
   - **Secret key** → `STRIPE_SECRET_KEY`
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Set up Webhooks:**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login and forward webhooks
stripe login
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`

### Step 6: Initialize Database

```bash
# Apply migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Seed with sample data (optional)
npm run db:seed
```

### Step 7: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## Service Configuration Details

### Database Connection

**Local Docker:**
```env
DATABASE_URL="postgresql://postgres:secretpassword@localhost:5432/gearshare?schema=public"
```

**Supabase:**
```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

**With Connection Pooling (Production):**
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&connection_limit=20&pool_timeout=20"
```

### Redis Configuration

Redis is optional but recommended for:
- Rate limiting persistence
- Response caching
- Session storage

```env
# Local
REDIS_URL="redis://localhost:6379"

# With password
REDIS_URL="redis://:password@localhost:6379"

# Cloud (Upstash, Redis Cloud)
REDIS_URL="rediss://default:password@host:6379"
```

**Without Redis:** The app works fine - caching and rate limiting use in-memory fallbacks.

### Stripe Test Mode

Use test card numbers:
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0027 6000 3184

Expiry: Any future date, CVC: Any 3 digits

---

## Available Commands

### Development
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database
```bash
npm run prisma:migrate       # Create and apply migrations
npm run prisma:generate      # Generate Prisma client
npm run prisma:studio        # Open database GUI
npm run db:seed              # Seed sample data
npm run prisma:reset         # Reset database (WARNING: deletes data)
```

### Testing
```bash
npm run test              # Run unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:e2e          # E2E tests (requires dev server)
```

### Docker
```bash
npm run docker:dev        # Start dev containers
npm run docker:dev:down   # Stop dev containers
npm run docker:prod       # Start production stack
npm run docker:logs       # View container logs
```

### Security
```bash
npm run security:audit    # Run security audit
npm run security:check    # Check vulnerabilities
npm run security:fix      # Auto-fix issues
```

---

## Production Deployment

### Environment Variables (Production)

```env
# Required
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
STRIPE_SECRET_KEY="sk_live_..."  # Use live keys!
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Security (IMPORTANT - generate random values)
JWT_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
ENCRYPTION_KEY="$(openssl rand -base64 32)"

# Optional
REDIS_URL="rediss://..."
SENTRY_DSN="https://..."
GOOGLE_ANALYTICS_ID="G-..."
```

### Docker Production

```bash
# Build and run
docker-compose -f docker-compose.yml up -d

# Or use npm script
npm run docker:prod
```

### Vercel Deployment

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

- **Railway:** Auto-detects Next.js, add env vars
- **Render:** Use `npm run build && npm run start`
- **AWS/GCP:** Use Docker image or serverless

---

## Troubleshooting

### "Can't reach database server"

```bash
# Check if PostgreSQL is running
docker ps | grep postgres
# or
brew services list | grep postgresql

# Restart
npm run docker:dev:down && npm run docker:dev
```

### "Missing Supabase environment variables"

Ensure `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
```

### "Stripe webhook signature verification failed"

```bash
# Make sure Stripe CLI is forwarding
stripe listen --forward-to localhost:3000/api/stripe-webhook

# Use the webhook secret it provides
```

### Prisma Issues

```bash
# Regenerate client
npm run prisma:generate

# Reset if schema changed significantly
npm run prisma:reset  # WARNING: Deletes data!
npm run prisma:migrate
npm run db:seed
```

### Redis Connection Issues

Redis is optional. If not configured, the app uses in-memory caching:
- Remove `REDIS_URL` from `.env.local`
- Or ensure Redis is running: `docker ps | grep redis`

---

## Architecture Overview

```
src/
├── app/                    # Next.js 15 App Router (pages & API routes)
├── domain/                 # Business logic (DDD)
│   ├── entities/           # Gear, User, Rental
│   ├── services/           # Domain services
│   └── ports/              # Repository interfaces
├── application/            # Use cases & CQRS
│   ├── commands/           # Write operations
│   ├── queries/            # Read operations
│   └── handlers/           # Command/Query handlers
├── infrastructure/         # External integrations
│   ├── repositories/       # Database implementations
│   ├── adapters/           # Stripe, etc.
│   └── cache/              # Redis/Memory cache
├── components/             # React components
└── lib/                    # Utilities, validation, etc.
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL |
| Auth | Supabase |
| Payments | Stripe |
| Caching | Redis (optional) |
| Testing | Jest, Playwright |
| CI/CD | GitHub Actions |

---

## Support

- **Issues:** https://github.com/your-repo/issues
- **Docs:** See `CLAUDE.md` and `ARCHITECTURE.md`

---

## License

Public domain - use freely.
