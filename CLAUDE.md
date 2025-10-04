# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
P2P Gear Rental Platform - A peer-to-peer marketplace for renting photography and videography equipment built with Next.js 15, React 19, TypeScript, Prisma, PostgreSQL, Supabase (auth), and Stripe (payments).

## Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Supabase (with SSR support via @supabase/ssr)
- **Payments**: Stripe
- **Caching**: Redis (optional, gracefully degrades if unavailable)
- **Real-time**: Pusher (infrastructure ready, not fully implemented)
- **Testing**: Jest (unit/integration), Playwright (E2E)
- **Validation**: Zod schemas for all API endpoints

## Essential Commands

### Development
```bash
npm run dev                    # Start development server on localhost:3000
npm run build                  # Production build (also runs type checking)
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run analyze                # Analyze bundle size (ANALYZE=true next build)
```

### Testing
```bash
npm run test                   # Run Jest unit tests (uses config/jest.config.js)
npm run test:watch             # Run tests in watch mode
npm run test:coverage          # Generate coverage report
npm run test:e2e               # Run Playwright E2E tests (uses config/playwright.config.ts)
npm run test:e2e:ui            # Run E2E tests with Playwright UI
```

**Important**: E2E tests expect dev server running on localhost:3000. Test files in `e2e/` directory use Playwright; tests elsewhere use Jest.

### Database Operations
```bash
npm run prisma:migrate         # Create and apply migration (dev)
npm run prisma:migrate:deploy  # Apply migrations (production)
npm run prisma:generate        # Generate Prisma Client (required after schema changes)
npm run prisma:studio          # Open Prisma Studio GUI
npm run prisma:reset           # Reset database (WARNING: deletes all data)
npm run db:seed                # Seed database with sample data (tsx prisma/seed.ts)
npm run migrate                # Combined: deploy migrations + generate client
```

**Migration workflow**: After changing `prisma/schema.prisma`, always run `npm run prisma:migrate` then `npm run prisma:generate`.

### Docker
```bash
npm run docker:dev             # Start dev environment (docker-compose.dev.yml)
npm run docker:dev:down        # Stop dev environment
npm run docker:prod            # Start production containers
npm run docker:prod:down       # Stop production containers
npm run docker:build           # Build Docker images
npm run docker:logs            # View container logs
npm run docker:backup          # Backup database (scripts/backup-restore.sh)
npm run docker:restore         # Restore database
```

### Security
```bash
npm run security:audit         # Run custom security audit (scripts/security-audit.ts)
npm run security:audit:json    # Security audit with JSON output
npm run security:audit:verbose # Verbose security audit
npm run security:check         # Run npm audit + custom checks (no exit on fail)
npm run security:fix           # Run npm audit fix
```

## Architecture & Code Structure

### Key Architectural Patterns

**1. API Route Composition Pattern**
All API routes use a composition of middleware wrappers:
```typescript
export const GET = withErrorHandler(
  withMonitoring(
    withRateLimit(limiter, limit)(
      async (request: NextRequest) => { /* handler logic */ }
    )
  )
);
```
Order matters: `withErrorHandler` (outermost) → `withMonitoring` → `withRateLimit` → handler

**2. Database Query Pattern**
Use `executeWithRetry()` for resilience and `trackDatabaseQuery()` for monitoring:
```typescript
const result = await executeWithRetry(() =>
  trackDatabaseQuery('operation.name', () =>
    prisma.model.operation(...)
  )
);
```

**3. Caching Strategy**
- `CacheManager` gracefully degrades if Redis unavailable
- All cache operations are async and return defaults on failure
- Cache keys are centralized in `CacheManager.keys`
- Invalidate caches after mutations using `CacheManager.invalidatePattern()`

**4. Validation Layer**
- All API endpoints validate inputs using Zod schemas from `src/lib/validations/`
- Schemas define both request validation and TypeScript types
- Use `schema.parse()` for validation (throws on error, caught by `withErrorHandler`)

### Critical Files & Their Purposes

**src/lib/supabase.ts**
- Exports singleton Supabase client
- Uses mock in test environment (NODE_ENV === 'test')
- Validates environment variables and throws if missing

**src/lib/prisma.ts**
- Singleton Prisma client with connection pooling
- Prevents multiple instances in development (hot reload issue)

**src/lib/rate-limit.ts**
- LRU-based rate limiting per IP address
- Pre-configured limiters: `strictRateLimit`, `authRateLimit`, `searchRateLimit`
- Configuration object: `rateLimitConfig` with limits for different endpoint types

**src/lib/api-error-handler.ts**
- Custom error classes: `ApiError`, `ValidationError`, `AuthenticationError`, etc.
- `handleApiError()` function formats errors consistently
- `withErrorHandler()` wrapper catches and formats all errors

**src/lib/cache.ts**
- `CacheManager` class for Redis operations
- Graceful degradation: returns null/false if Redis unavailable
- Centralized cache key generation via `CacheManager.keys`
- TTL constants: `CacheManager.TTL.SHORT/MEDIUM/LONG/VERY_LONG/DAY`

**src/lib/monitoring.ts**
- `monitoring` singleton tracks API metrics
- `withMonitoring()` wrapper logs request/response metrics
- `trackDatabaseQuery()` tracks slow queries (warns if >1000ms)
- `PerformanceTimer` class for detailed performance tracking

**src/lib/validations/**
- Zod schemas for all domain models
- `gear.ts`: createGearSchema, updateGearSchema, gearQuerySchema
- `rental.ts`: rental creation and status updates
- `auth.ts`: authentication schemas
- Export TypeScript types via `z.infer<typeof schema>`

### Database Schema (Prisma)

**Key Models**:
- `User`: Linked to Supabase auth by `id`, tracks reviews/ratings
- `Gear`: Equipment listings with indexed fields (category, location, price, condition, brand/model)
- `Rental`: Rental transactions with Stripe payment integration (paymentIntentId, clientSecret)
- `Review`: One-per-rental, 1-5 star ratings
- `Conversation` + `Message`: Real-time messaging (Pusher-ready)
- `Dispute` + `DisputeResponse`: Dispute resolution system with enums for category/status/priority

**Important Indexes**:
- Gear: category, city+state, dailyRate, userId, brand+model, condition
- Rental: renterId, ownerId, gearId, status, startDate+endDate, paymentStatus
- Review: revieweeId, rating
- Message: conversationId+createdAt

### Next.js 15 Route Parameters
**CRITICAL**: Next.js 15 changed params to be async promises. Dynamic routes must:
```typescript
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // await the promise
  // use id...
}
```
This applies to all dynamic routes: `[id]/page.tsx`, `[slug]/page.tsx`, etc.

### Path Aliases
TypeScript path alias: `@/*` maps to `src/*`
Example: `import { prisma } from '@/lib/prisma'`

### Environment Variables
Required variables (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret

Optional:
- `REDIS_URL`: Redis connection string (defaults to localhost:6379)
- `PUSHER_*`: Pusher credentials for real-time features
- `WEBHOOK_URL`: Alert webhook URL for monitoring

**Security**: Environment variables are validated at runtime. Missing required vars throw errors.

## Testing Strategy

### Jest Configuration
- Config: `config/jest.config.js`
- Environment: jsdom
- Module aliases map to `__mocks__` for Supabase, Prisma, Next.js modules
- Transform: babel-jest
- Root: `<rootDir>/..` (config is in `config/` subdirectory)
- Ignored: `e2e/`, `.next/`

**Running specific tests**:
```bash
npm run test -- path/to/file.test.ts        # Single file
npm run test:watch -- --testNamePattern="test name"  # Specific test
```

### Playwright Configuration
- Config: `config/playwright.config.ts`
- Test directory: `e2e/`
- Base URL: `http://localhost:3000`
- Browsers: Chromium, Firefox, WebKit
- Requires dev server running before tests

### Mock Strategy
All external dependencies mocked in `__mocks__/`:
- `@supabase/supabase-js`: Mock auth methods
- `@/lib/prisma`: Mock database operations
- `next/server`, `next/navigation`: Mock Next.js APIs

## Development Patterns

### Adding New API Endpoints

1. **Create validation schema** in `src/lib/validations/`
2. **Choose appropriate rate limiter** from `rateLimitConfig`
3. **Wrap handler** with middleware:
   ```typescript
   export const POST = withErrorHandler(
     withMonitoring(
       withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
         async (request: NextRequest) => {
           // Validate auth
           const { data: { session } } = await supabase.auth.getSession();
           if (!session) throw new AuthenticationError();

           // Validate input
           const body = await request.json();
           const validated = schema.parse(body);

           // Database operation with retry
           const result = await executeWithRetry(() =>
             trackDatabaseQuery('operation', () => prisma.model.create(...))
           );

           // Invalidate caches
           await CacheManager.invalidatePattern('pattern:*');

           return NextResponse.json(result);
         }
       )
     )
   );
   ```
4. **Write tests** in `__tests__/route.test.ts`
5. **Update cache invalidation** if endpoint mutates data

### Adding New Database Models

1. **Update** `prisma/schema.prisma`
2. **Add indexes** for commonly queried fields
3. **Create migration**: `npm run prisma:migrate -- --name descriptive_name`
4. **Generate client**: `npm run prisma:generate`
5. **Create Zod schema** in `src/lib/validations/`
6. **Add cache keys** to `CacheManager.keys`

### Error Handling Best Practices

- Use custom error classes from `api-error-handler.ts`
- Never expose sensitive data in error messages
- `ValidationError` for invalid input (400)
- `AuthenticationError` for missing/invalid auth (401)
- `AuthorizationError` for insufficient permissions (403)
- `NotFoundError` for missing resources (404)
- `ConflictError` for constraint violations (409)
- `RateLimitError` thrown automatically by rate limiter (429)

### Logging & Monitoring

Use `logger` from `src/lib/logger.ts`:
```typescript
logger.debug('message', { context }, 'CATEGORY');
logger.info('message', { context }, 'CATEGORY');
logger.warn('message', { context }, 'CATEGORY');
logger.error('message', { context }, 'CATEGORY');
```

Categories: `API`, `DB`, `CACHE`, `AUTH`, `PAYMENT`

## Important Implementation Notes

### Supabase Authentication
- Client-side: Use `@supabase/ssr` for SSR compatibility
- Server-side: Import from `src/lib/supabase.ts`
- Session check pattern: `const { data: { session } } = await supabase.auth.getSession()`
- User ID from session: `session.user.id` (matches Prisma User.id)

### Stripe Integration
- Payment flow: Create PaymentIntent → Confirm → Handle webhook
- Test mode webhook requires Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe-webhook`
- Webhook handler: `src/app/api/stripe-webhook/route.ts`
- Verify signature using `STRIPE_WEBHOOK_SECRET`

### Cache Invalidation Patterns
After mutations:
```typescript
// Specific item
await CacheManager.del(CacheManager.keys.gear.item(id));

// Pattern-based (multiple keys)
await CacheManager.invalidatePattern('gear:list:*');

// Multiple operations
await Promise.all([
  CacheManager.del(key1),
  CacheManager.invalidatePattern('pattern:*'),
]);
```

### Search Engine
Two search paths:
1. **Text search**: Uses `searchEngine.search()` with fuzzy matching (Fuse.js)
2. **Filtering/browsing**: Uses `queryOptimizer.getGearListings()` with database queries

Automatically selects based on presence of search query.

## Known Issues & Gotchas

1. **Next.js 15 Params**: Always await params in dynamic routes
2. **Jest Mocking**: Module mocks in `__mocks__/` must match import paths exactly
3. **Redis Optional**: Application works without Redis (caching disabled)
4. **Prisma Connection Pool**: Singleton pattern prevents hot-reload issues in dev
5. **Supabase User Sync**: Users created on first API call via `upsert` pattern
6. **Rate Limit Bypass**: Uses LRU cache (in-memory), resets on server restart

## Scripts & Automation

**scripts/security-audit.ts**: Custom security scanner
- Checks for exposed secrets in environment files
- Validates security headers configuration
- Can output JSON format for CI/CD integration

**scripts/docker-setup.sh**: Initialize Docker development environment
**scripts/backup-restore.sh**: Database backup/restore automation
**scripts/check-performance-thresholds.js**: Performance monitoring

## Configuration Files Location

All configs in `config/` directory:
- `config/jest.config.js`: Jest test configuration
- `config/jest.setup.ts`: Jest test setup
- `config/playwright.config.ts`: Playwright E2E configuration
- `config/babel.config.js`: Babel transpilation
- `config/tsconfig.json`: TypeScript compiler options (extended by root)
- `config/next.config.ts`: Next.js configuration

Root also has `babel.config.js`, `next.config.ts`, `tsconfig.json` that extend/reference the config versions.

## Performance Considerations

- **Pagination**: Default 20 items, max 50 per request
- **Cache TTL**: SHORT(60s), MEDIUM(300s), LONG(1800s), VERY_LONG(3600s), DAY(86400s)
- **Slow Query Alert**: Logs warning if database query >1000ms
- **Database Retry**: `executeWithRetry()` implements exponential backoff
- **Image Limits**: Max 10 images per gear listing

## Future Implementation Notes

Features with infrastructure ready but not fully implemented:
- **Real-time messaging**: Pusher configured (`src/lib/pusher.ts`), Message/Conversation models exist
- **Geolocation search**: Mapbox integrated, radius search prepared in schema
- **Advanced search**: Semantic search scaffolding in `src/lib/ai/semantic-search.ts`
- **Fraud detection**: Framework in `src/lib/ai/fraud-detection.ts`
- **AI pricing**: Pricing engine in `src/lib/ai/pricing-engine.ts`
