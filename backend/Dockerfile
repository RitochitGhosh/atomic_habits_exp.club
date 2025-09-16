# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev)
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build (runs tsc and copies openapi.yaml to dist)
RUN npm run build


# Stage 2: Runtime
FROM node:18-alpine

# Install OpenSSL 1.1 compatibility package for Prisma
RUN apk add --no-cache openssl1.1-compat

WORKDIR /app

# Copy only package files again
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built output from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma


# Generate Prisma client (runtime)
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Switch to a non-root user for security
USER node

# Start app
CMD ["node", "dist/index.js"]