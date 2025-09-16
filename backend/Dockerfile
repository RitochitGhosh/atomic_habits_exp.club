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

# Build (runs tsc)
RUN npm run build


# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app

# Copy only package files again
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built output from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3001

# Start app
CMD ["node", "dist/index.js"]
