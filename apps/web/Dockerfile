FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Disable telemetry and enable corepack
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

# 1. Pruning monorepo via Turbo
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune web --docker

# 2. Install dependencies with increased timeouts
FROM base AS installer
WORKDIR /app

# Copy package metadata and lockfile
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Set network stability settings for pnpm (10 minute timeout, retries)
RUN pnpm config set fetch-timeout 600000 && \
  pnpm config set fetch-retries 5 && \
  pnpm config set fetch-retry-mintimeout 20000 && \
  pnpm config set fetch-retry-maxtimeout 120000 && \
  pnpm install --frozen-lockfile

# 3. Build project
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=web...

# 4. Final Production Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Copy the Next.js build output
COPY --from=installer /app/apps/web/.next/standalone ./
COPY --from=installer /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer /app/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]