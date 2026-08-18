# ─────────────────────────────────────────────────────────
# Shokhi AI (সখী AI) — Production Node.js Dockerfile
# Multi-stage build: deps → builder → runner
# ─────────────────────────────────────────────────────────

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 shokhi && adduser -u 1001 -G shokhi -s /bin/sh -D shokhi

# Copy app files
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create required directories with correct ownership
RUN mkdir -p uploads && chown -R shokhi:shokhi /app

USER shokhi

# Environment defaults
ENV NODE_ENV=production
ENV NODE_PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${NODE_PORT}/api/health || exit 1

EXPOSE 3000

# Start Node.js server
CMD ["node", "server.js"]
