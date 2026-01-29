FROM node:20-alpine

WORKDIR /app

# IMPORTANT: Build context is REPO ROOT, not backend/ folder
# All COPY paths must be relative to repository root
COPY backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend source files from backend/ subdirectory
COPY backend/src/ ./src/

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "src/index.js"]
