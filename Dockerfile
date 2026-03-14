# ==========================================
# Cloud Code — Multi-stage Dockerfile
# ==========================================
# No local npm install needed — Docker handles everything.

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

COPY package.json ./
COPY prisma ./prisma

RUN npm install && npx prisma generate

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate

COPY . .

# Build Next.js
ARG NEXT_PUBLIC_CODER_URL
ENV NEXT_PUBLIC_CODER_URL=$NEXT_PUBLIC_CODER_URL
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

ARG NEXT_PUBLIC_CODER_URL
ENV NEXT_PUBLIC_CODER_URL=$NEXT_PUBLIC_CODER_URL

RUN apk add --no-cache openssl wget

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Install Prisma CLI locally for the startup migration
COPY --from=builder /app/prisma ./prisma

# Create entrypoint that runs migrations then starts
RUN printf '#!/bin/sh\nset -e\necho "Running database migrations..."\nnpx prisma db push --accept-data-loss\necho "Starting Cloud Code..."\nexec node server.js\n' > /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh
    
RUN chown -R nextjs:nodejs /app

# Switch to nextjs user before running npm install so it owns the folders it creates
USER nextjs

# Copy over the specific @prisma and .prisma modules from the builder stage
# Standard standalone mode strips the builder generator scripts that Prisma needs.
COPY --chown=nextjs:nodejs --from=builder /app/node_modules/@prisma /app/node_modules/@prisma
COPY --chown=nextjs:nodejs --from=builder /app/node_modules/.prisma /app/node_modules/.prisma

RUN npm install prisma@6.5.0
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=library

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Note: The '5ed8394148d1:3000' log means the app is running on port 3000 INSIDE the docker container.
# Docker compose maps this to port 3080 on your host machine.
ENTRYPOINT ["/app/entrypoint.sh"]
