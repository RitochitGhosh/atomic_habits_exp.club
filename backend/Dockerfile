FROM node:18-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
RUN apk add --no-cache openssl
WORKDIR /app
USER node
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/openapi.yaml ./openapi.yaml
RUN npx prisma generate
EXPOSE 3001
CMD ["node", "dist/index.js"]