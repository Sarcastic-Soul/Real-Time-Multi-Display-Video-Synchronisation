# Base Node.js 20 image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY server/package*.json ./server/
COPY web/package*.json ./web/

# Install dependencies
RUN npm install
RUN npm install --prefix server
RUN npm install --prefix web

# Copy full application source code
COPY . .

# Build server & web applications
RUN npm run build --prefix server
RUN npm run build --prefix web

# Expose HTTP ports (3000 for Web, 4000 for Socket Server)
EXPOSE 3000 4000

# Start both services concurrently
CMD ["npm", "run", "dev"]
