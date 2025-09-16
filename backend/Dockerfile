FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json if it exists
COPY package*.json ./

# Install dependencies (use npm ci if lockfile exists, fallback to npm install)
# This way it works even if you don't commit package-lock.json in backend
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
