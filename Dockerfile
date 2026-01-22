# Use the official Node.js 20 image (required for Next.js 16+)
# https://hub.docker.com/_/node
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry at build time
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client for TypeScript types
RUN npx prisma generate

# Build with optimized memory usage and dummy env vars
ENV NODE_OPTIONS="--max-old-space-size=4096"
# Set dummy environment variables for build time
ENV STRIPE_SECRET_KEY=sk_test_dummy
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy_key
ENV SUPABASE_SERVICE_ROLE_KEY=dummy_service_role
ENV REDIS_URL=redis://localhost:6379
# Build with production config that skips static generation issues
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Set dummy environment variables for build time to prevent errors
ENV STRIPE_SECRET_KEY=sk_test_dummy
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy_key
ENV SUPABASE_SERVICE_ROLE_KEY=dummy_service_role
ENV REDIS_URL=redis://localhost:6379
# Use production config that avoids static generation
RUN cp config/next.config.prod.js config/next.config.js && npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line to disable telemetry at runtime
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]