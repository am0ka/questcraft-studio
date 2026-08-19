FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. Prune the monorepo
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune web --docker

# 2. Install dependencies
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# 3. Build the project
COPY --from=pruner /app/out/full/ .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo run build --filter=web...

# Fix: Next.js standalone file tracing does not include @swc/helpers when using pnpm.
# Find @swc/helpers in the pnpm store and copy it into the standalone output next to the next package.
RUN STANDALONE="apps/web/.next/standalone" && \
    NEXT_PNPM=$(find "$STANDALONE/node_modules/.pnpm" -maxdepth 1 -name "next@*" -type d | head -1) && \
    SWC_STORE=$(find node_modules/.pnpm -maxdepth 1 -name "@swc+helpers@*" -type d | head -1) && \
    if [ -n "$NEXT_PNPM" ] && [ -n "$SWC_STORE" ]; then \
      mkdir -p "$NEXT_PNPM/node_modules/@swc" && \
      cp -r "$SWC_STORE/node_modules/@swc/helpers" "$NEXT_PNPM/node_modules/@swc/helpers"; \
    fi

# 4. Production Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the Next.js build output
COPY --from=installer /app/apps/web/.next/standalone ./
COPY --from=installer /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer /app/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]