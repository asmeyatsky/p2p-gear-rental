# Dockerfile for P2P Gear Rental Platform
# Optimized for fast builds and small image size

# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# Install glibc compatibility for native modules (gcompat replaces libc6-compat in Alpine 3.17+)
RUN apk add --no-cache gcompat || true

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install ALL dependencies (dev needed for build)
RUN npm ci

# ============================================
# Stage 2: Build the application
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./

# Copy source files
COPY prisma ./prisma
COPY src ./src
COPY public ./public
COPY config ./config
COPY next.config.ts tsconfig.json postcss.config.mjs ./

# Generate Prisma client
RUN npx prisma generate

# Build environment - skip database operations
ENV SKIP_DB_DURING_BUILD="true"
ENV NODE_ENV="production"
ENV NEXT_TELEMETRY_DISABLED=1

# Dummy env vars for build validation
ENV DATABASE_URL="postgresql://x:x@localhost:5432/x"
ENV NEXT_PUBLIC_SUPABASE_URL="https://x.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="x"
ENV STRIPE_SECRET_KEY="sk_test_x"

# Build Next.js
RUN npm run build

# ============================================
# Stage 3: Production runner (minimal)
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy only production artifacts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma runtime
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health/liveness || exit 1

CMD ["node", "server.js"]
