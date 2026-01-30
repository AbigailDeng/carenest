# Backend Proxy Server Dockerfile
# Multi-stage build for optimized image size

# Stage 1: Dependencies installation
FROM node:18-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install only production dependencies needed for backend
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Stage 2: Runtime
FROM node:18-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy backend server files
COPY server/proxy-server.js ./
COPY package.json ./

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (default 3001, can be overridden via PROXY_PORT env var)
EXPOSE 3001

# Health check (using curl which is available in alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Set environment variables with defaults
ENV NODE_ENV=production
ENV PROXY_PORT=3001

# Start the server
CMD ["node", "proxy-server.js"]
