# Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Install deps and build
COPY server/package.json server/package-lock.json* ./server/
COPY server/tsconfig.json server/
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY server/src ./server/src

WORKDIR /app/server
RUN npm ci
RUN npm run build

# Generate Prisma client (prisma is a devDependency in server)
WORKDIR /app
RUN npx prisma generate --schema=./prisma/schema.prisma || true

# Production image
FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY prisma ./prisma
COPY server/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "--env-file=.env", "dist/index.js"]
