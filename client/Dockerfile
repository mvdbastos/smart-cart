# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy files
COPY client/package.json client/package-lock.json* ./
COPY client/tsconfig*.json ./
COPY client/vite.config.ts ./
COPY client/public ./public
COPY client/src ./src

RUN npm ci
RUN npm run build

# Production stage - nginx
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
