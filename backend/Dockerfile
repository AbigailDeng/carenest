# Backend Proxy Server Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source files
COPY src/ ./src/

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

# Default port (can be overridden via PORT env var)
EXPOSE 8080

ENV NODE_ENV=production

# Start the server
CMD ["node", "src/proxy-server.js"]
