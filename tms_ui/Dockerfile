# Frontend Dockerfile - Multi-stage build for Production

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Build application
RUN npm run build

# Production stage - Nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY deploy/nginx-app.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose default port (can be overridden via Dockerfile PORT or docker-compose)
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
