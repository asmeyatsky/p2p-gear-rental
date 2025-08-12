# Claude Code Project Memory

## Project Overview
P2P Gear Rental Platform - A peer-to-peer marketplace for renting photography and videography equipment.

## Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Supabase
- **Payments**: Stripe
- **Testing**: Jest, Playwright, Testing Library
- **Deployment**: Ready for containerization with Docker

## Current Status (as of 2025-01-12)
✅ **Recently Fixed Critical Issues:**
- Jest/Babel configuration issues resolved
- Next.js 15 route parameter compatibility implemented
- TypeScript compilation errors fixed
- Test infrastructure properly configured
- Database schema updated with payment fields
- Stripe integration compatibility resolved

## Suggested Improvements & Roadmap

### 🔥 CRITICAL IMPROVEMENTS (Week 1 - Immediate)

#### 1. Security Enhancements
**Priority: CRITICAL**

```typescript
// src/lib/supabase.ts - Fix temporary bypass (SECURITY RISK)
// CURRENT ISSUE: Lines 22-25 disable key validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

```typescript
// src/lib/rate-limit.ts - Add rate limiting
import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export default function rateLimit(options: Options = {}) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (token: string, limit: number) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = tokenCache.get(token) as number[] || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        if (isRateLimited) {
          reject(new Error('Rate limit exceeded'));
        } else {
          resolve();
        }
      }),
  };
}
```

**Environment Variables Setup:**
```bash
# .env.example
DATABASE_URL="postgresql://username:password@localhost:5432/database"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="your_webhook_secret"
REDIS_URL="redis://localhost:6379"
PUSHER_APP_ID="your_pusher_app_id"
PUSHER_KEY="your_pusher_key"
PUSHER_SECRET="your_pusher_secret"
PUSHER_CLUSTER="your_pusher_cluster"
```

#### 2. Error Handling & API Consistency
**Priority: HIGH**

```typescript
// src/lib/api-error-handler.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

#### 3. Input Validation
**Priority: HIGH**

```bash
npm install zod
```

```typescript
// src/lib/validations/gear.ts
import { z } from 'zod';

export const createGearSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(10).max(2000),
  dailyRate: z.number().positive().max(10000),
  weeklyRate: z.number().positive().optional(),
  monthlyRate: z.number().positive().optional(),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  images: z.array(z.string().url()).min(1).max(10),
  category: z.string().optional(),
  brand: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor']).optional(),
});

export const createRentalSchema = z.object({
  gearId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  message: z.string().max(500).optional(),
});
```

### ⚡ PERFORMANCE IMPROVEMENTS (Week 2-3)

#### 1. Database Optimization
**Add indexes to Prisma schema:**

```prisma
// prisma/schema.prisma - Add these indexes
model Gear {
  // ... existing fields
  
  @@index([category])
  @@index([city, state])
  @@index([dailyRate])
  @@index([userId])
  @@index([createdAt])
  @@fulltext([title, description])
}

model Rental {
  // ... existing fields
  
  @@index([renterId])
  @@index([ownerId])
  @@index([status])
  @@index([startDate, endDate])
}

model User {
  // ... existing fields
  
  @@index([email])
}
```

#### 2. Caching Layer
**Install Redis:**
```bash
npm install ioredis @types/ioredis
```

```typescript
// src/lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCache(key: string, value: any, ttl = 300): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}
```

#### 3. Pagination Implementation
**Update gear API:**

```typescript
// src/app/api/gear/route.ts - Add pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Max 50 items
  const skip = (page - 1) * limit;

  // Try cache first
  const cacheKey = `gear:page:${page}:limit:${limit}:${searchParams.toString()}`;
  const cached = await getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const where = buildWhereClause(searchParams);
  
  const [gear, total] = await Promise.all([
    prisma.gear.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, full_name: true }
        }
      }
    }),
    prisma.gear.count({ where })
  ]);

  const result = {
    data: gear,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };

  // Cache for 5 minutes
  await setCache(cacheKey, result, 300);
  
  return NextResponse.json(result);
}
```

### 🚀 FEATURE ENHANCEMENTS (Week 4)

#### 1. User Reviews & Ratings System
**Add to Prisma schema:**

```prisma
// prisma/schema.prisma
model Review {
  id        String   @id @default(cuid())
  rating    Int      // 1-5 stars
  comment   String?
  rentalId  String   @unique
  rental    Rental   @relation(fields: [rentalId], references: [id], onDelete: Cascade)
  reviewerId String
  reviewer  User     @relation("ReviewsGiven", fields: [reviewerId], references: [id])
  revieweeId String
  reviewee  User     @relation("ReviewsReceived", fields: [revieweeId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([revieweeId])
  @@index([rating])
}

model User {
  // Add to existing User model
  reviewsGiven     Review[] @relation("ReviewsGiven")
  reviewsReceived  Review[] @relation("ReviewsReceived")
  averageRating    Float?
  totalReviews     Int      @default(0)
}
```

#### 2. Real-time Messaging
**Install Pusher:**
```bash
npm install pusher pusher-js
```

```typescript
// src/lib/pusher.ts
import Pusher from 'pusher';
import PusherClient from 'pusher-js';

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

// Message schema
model Message {
  id        String   @id @default(cuid())
  content   String
  senderId  String
  sender    User     @relation("MessagesSent", fields: [senderId], references: [id])
  rentalId  String
  rental    Rental   @relation(fields: [rentalId], references: [id])
  readAt    DateTime?
  createdAt DateTime @default(now())

  @@index([rentalId, createdAt])
}
```

#### 3. Advanced Search & Filters
```typescript
// src/components/gear/AdvancedSearchFilters.tsx
export default function AdvancedSearchFilters({ onFiltersChange }: { onFiltersChange: (filters: any) => void }) {
  const [filters, setFilters] = useState({
    category: '',
    condition: '',
    maxPrice: '',
    location: '',
    availability: 'available',
    sortBy: 'newest'
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <select 
          name="category" 
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value})}
          className="border rounded px-3 py-2"
        >
          <option value="">All Categories</option>
          <option value="cameras">Cameras</option>
          <option value="lenses">Lenses</option>
          <option value="lighting">Lighting</option>
          <option value="audio">Audio</option>
          <option value="drones">Drones</option>
          <option value="accessories">Accessories</option>
        </select>
        
        <select 
          name="condition" 
          value={filters.condition}
          onChange={(e) => setFilters({...filters, condition: e.target.value})}
          className="border rounded px-3 py-2"
        >
          <option value="">Any Condition</option>
          <option value="new">New</option>
          <option value="like-new">Like New</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
        </select>
        
        <input 
          type="number" 
          placeholder="Max daily rate" 
          value={filters.maxPrice}
          onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
          className="border rounded px-3 py-2"
        />
        
        <input 
          type="text" 
          placeholder="City, State" 
          value={filters.location}
          onChange={(e) => setFilters({...filters, location: e.target.value})}
          className="border rounded px-3 py-2"
        />

        <select 
          name="sortBy" 
          value={filters.sortBy}
          onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
          className="border rounded px-3 py-2"
        >
          <option value="newest">Newest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
          <option value="distance">Distance</option>
        </select>

        <button 
          onClick={() => onFiltersChange(filters)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
```

### 🛠️ DEVOPS & DEPLOYMENT (Post-Launch)

#### 1. CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npx prisma migrate deploy
        
      - name: Generate Prisma client
        run: npx prisma generate
      
      - name: Run type checking
        run: npx tsc --noEmit
      
      - name: Run linting
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test
      
      - name: Run build
        run: npm run build
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          # Add your deployment steps here
          echo "Deploying to production..."
```

#### 2. Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/gearshare
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:13
    environment:
      POSTGRES_DB: gearshare
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### 3. Monitoring & Logging
```typescript
// src/lib/monitoring.ts
export function logApiCall(req: NextRequest, duration: number, status: number, error?: string) {
  const logData = {
    method: req.method,
    url: req.url,
    duration,
    status,
    error,
    timestamp: new Date().toISOString(),
    userAgent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
  };
  
  if (process.env.NODE_ENV === 'production') {
    // Send to monitoring service (DataDog, Sentry, etc.)
    console.log('API_CALL', JSON.stringify(logData));
  } else {
    console.log('API Call:', logData);
  }
}

// Middleware wrapper for API routes
export function withMonitoring(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const start = Date.now();
    
    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - start;
      logApiCall(req, duration, response.status);
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      logApiCall(req, duration, 500, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };
}
```

### 🎨 UI/UX IMPROVEMENTS

#### 1. Loading States & Skeletons
```typescript
// src/components/ui/GearCardSkeleton.tsx
export default function GearCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="h-48 w-full bg-gray-300"></div>
      <div className="p-4">
        <div className="h-4 bg-gray-300 rounded mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="h-6 bg-gray-300 rounded w-1/3"></div>
      </div>
    </div>
  );
}

// src/components/ui/LoadingSpinner.tsx
export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}></div>
  );
}
```

#### 2. Enhanced Error Boundaries
```typescript
// src/components/ErrorBoundary.tsx
'use client';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="text-center py-8 px-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Something went wrong</h2>
          <p className="text-gray-600 mb-4">We're sorry for the inconvenience. Please try refreshing the page.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing Strategy

### Current Test Commands
```bash
# Unit tests
npm run test

# E2E tests  
npm run test:e2e

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

### Test Coverage Goals
- **Unit Tests**: 80%+ coverage for utils, API routes, components
- **Integration Tests**: Critical user flows (rental process, payments)
- **E2E Tests**: Happy path scenarios, error handling, responsive design

### Priority Test Areas
1. Payment processing flow
2. User authentication & authorization
3. Gear search and filtering
4. Rental request workflow
5. Real-time messaging (when implemented)

## Performance Targets
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **API Response Time**: < 300ms (95th percentile)
- **Database Query Time**: < 100ms average

## Security Checklist
- [ ] Fix Supabase key validation bypass
- [ ] Implement rate limiting on all API routes
- [ ] Add input validation with Zod schemas
- [ ] Set up proper environment variable management
- [ ] Implement proper error logging without exposing sensitive data
- [ ] Add CORS configuration
- [ ] Implement proper session management
- [ ] Set up Content Security Policy headers
- [ ] Add SQL injection protection (Prisma helps with this)
- [ ] Implement proper file upload validation

## Launch Readiness Checklist

### Before Production Deploy
- [ ] Security audit completed
- [ ] Performance optimization implemented
- [ ] Database indexes added
- [ ] Caching layer implemented
- [ ] Error monitoring setup
- [ ] Backup strategy in place
- [ ] SSL certificate configured
- [ ] Domain name configured
- [ ] Email service configured
- [ ] Payment processing tested in production mode

### Post-Launch Monitoring
- [ ] Application performance monitoring
- [ ] Database performance monitoring  
- [ ] Error rate monitoring
- [ ] User behavior analytics
- [ ] Security monitoring
- [ ] Cost monitoring (especially for database and external services)

## Common Commands & Scripts

```bash
# Development
npm run dev

# Database operations
npx prisma migrate dev --name your_migration_name
npx prisma studio
npx prisma generate
npx prisma db seed

# Testing
npm run test -- --watch
npm run test:coverage
npm run test:e2e
npm run test:e2e -- --ui

# Build & Deploy
npm run build
npm run start

# Docker operations
docker-compose up -d
docker-compose down
docker-compose logs app

# Database backup
pg_dump $DATABASE_URL > backup.sql
```

## Architecture Notes

### Current Structure
```
src/
├── app/                    # Next.js 13+ app router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── gear/              # Gear-related pages
│   └── my-rentals/        # User rental management
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
└── types/                 # TypeScript type definitions
```

### Recommended Future Structure (for scaling)
```
src/
├── app/                   # Next.js app router
├── components/            
│   ├── ui/               # Basic UI components
│   ├── forms/            # Form components
│   ├── gear/             # Gear-specific components
│   └── user/             # User-specific components
├── lib/
│   ├── auth/             # Authentication utilities
│   ├── database/         # Database utilities
│   ├── payments/         # Payment processing
│   ├── notifications/    # Email/push notifications
│   └── validations/      # Input validation schemas
├── hooks/                # Custom React hooks
├── utils/                # Pure utility functions
├── types/                # TypeScript definitions
└── constants/            # Application constants
```

## Integration Points

### External Services
- **Supabase**: Authentication, file storage
- **Stripe**: Payment processing, subscriptions
- **Pusher**: Real-time messaging (future)
- **Redis**: Caching layer (future)
- **SendGrid/Resend**: Email notifications (future)
- **Cloudinary**: Image optimization (future)

### API Endpoints
```
GET    /api/gear              # List gear with pagination & filters
POST   /api/gear              # Create new gear listing
GET    /api/gear/[id]         # Get specific gear item
PUT    /api/gear/[id]         # Update gear item
DELETE /api/gear/[id]         # Delete gear item

GET    /api/rentals           # List user's rentals
POST   /api/rentals           # Create rental request
PUT    /api/rentals/[id]/approve  # Approve rental
PUT    /api/rentals/[id]/reject   # Reject rental

POST   /api/stripe-webhook    # Handle Stripe webhooks
```

## Recent Changes Log
- **2025-01-12**: Fixed critical TypeScript, Jest, and Next.js 15 compatibility issues
- **2025-01-12**: Added comprehensive improvement roadmap and architecture recommendations
- **2025-01-12**: Documented security concerns and performance optimization strategies