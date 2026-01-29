# Backend Proxy Server Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy source files
COPY . .

# Set environment
ENV NODE_ENV=production

EXPOSE 8080

CMD ["npm", "start"]
