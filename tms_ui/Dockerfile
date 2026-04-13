# Frontend Dockerfile - Multi-stage build

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./

RUN npm install --only=production

COPY . .

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx config
RUN echo 'server { listen 5173; location / { root /usr/share/nginx/html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

# Copy built app from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
