# --- Stage 1: Build Phase ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY server/package*.json ./server/
COPY web/package*.json ./web/

# Install dependencies
RUN npm ci
RUN npm ci --prefix server
RUN npm ci --prefix web

# Copy source code
COPY . .

# Set Node environment to production for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build TypeScript server and Next.js frontend
RUN npm run build --prefix server
RUN npm run build --prefix web

# --- Stage 2: Production Runtime Phase (<100MB RAM usage) ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package manifests & built artifacts from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules

COPY --from=builder /app/web/package*.json ./web/
COPY --from=builder /app/web/.next ./web/.next
COPY --from=builder /app/web/public ./web/public
COPY --from=builder /app/web/node_modules ./web/node_modules

# Expose Web (3000) and Socket Server (4000)
EXPOSE 3000 4000

# Start production servers (low memory footprint < 100MB RAM)
CMD ["npm", "run", "start"]
