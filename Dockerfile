# syntax=docker/dockerfile:1

# ---- deps: install from a clean lockfile ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Prisma's `postinstall: prisma generate` (run by npm ci) needs the schema, so
# the prisma dir must be present before install.
COPY prisma ./prisma
# Cache the npm download cache across builds so re-installs don't re-fetch every
# tarball (BuildKit persists this mount on the build host between builds).
RUN --mount=type=cache,target=/root/.npm npm ci

# ---- builder: compile the Next.js standalone output ----
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Persist the Next.js build cache between Docker builds. Without this every image
# build is a cold compile that grows with the codebase (the "builds keep getting
# slower" symptom); the cache mount lets the compiler reuse prior work so only
# changed modules recompile. BuildKit keeps the mount on the build host — it is
# not baked into any layer, so the runtime image stays minimal.
RUN --mount=type=cache,target=/app/.next/cache npm run build

# ---- migrator: runs prisma migrate deploy + seed on deploy (no Next build) ----
FROM node:22-alpine AS migrator
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

# ---- runner: minimal production image ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
