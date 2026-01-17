# Stage 1: Build
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml .npmrc ./

# Install dependencies (pnpm.onlyBuiltDependencies in package.json allows build scripts)
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build the SSR app (session password for prerender, OAuth read at runtime)
RUN NUXT_SESSION_PASSWORD=build-time-placeholder-min-32-chars pnpm build

# Stage 2: Production runtime
FROM node:22-bookworm-slim

WORKDIR /app

# Copy built output from builder
COPY --from=builder /app/.output ./.output

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Run the Nitro server
CMD ["node", ".output/server/index.mjs"]
