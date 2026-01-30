# Backend Proxy Server Dockerfile
# Note: Build context is repo root, so paths need backend/ prefix
FROM node:20-alpine

WORKDIR /app

# Copy package files from backend folder
COPY backend/package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy entire backend directory
COPY backend/ ./

# Set environment
ENV NODE_ENV=production

EXPOSE 8080

# backend/package.json has: "start": "node src/proxy-server.js"
CMD ["npm", "start"]
