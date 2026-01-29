# Backend Proxy Server Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files and source
COPY package.json ./
COPY src/ ./src/

# Install production dependencies
RUN npm install --omit=dev

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "src/proxy-server.js"]
