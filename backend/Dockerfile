# Stage 1: Build
FROM node:18-alpine AS builder

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl1.1-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install ALL dependencies (including dev)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build


# Stage 2: Runtime
FROM node:18-alpine

# Install OpenSSL 1.1 compatibility package for Prisma
RUN apk add --no-cache openssl1.1-compat

WORKDIR /app

# Create app directory and set ownership
RUN mkdir -p /app && chown -R node:node /app

# Copy package files
COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma

# Switch to node user before installing dependencies
USER node

# Install only production dependencies
RUN npm ci --omit=dev --no-audit --no-fund

# Generate Prisma client for production
RUN npx prisma generate

# Copy built output from builder stage
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/openapi.yaml ./openapi.yaml

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/healthcheck.js || exit 1

# Start app
CMD ["node", "dist/index.js"]