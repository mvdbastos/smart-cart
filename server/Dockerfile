# Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package.json at /app root so @prisma/client is resolvable from schema path
COPY tsconfig.base.json ./
COPY server/package.json ./package.json
COPY server/tsconfig.json ./server/tsconfig.json
COPY prisma ./prisma
COPY server/src ./server/src

# Install packages at /app root: @prisma/client ends up in /app/node_modules/
# Prisma resolves it from schema dir (/app/prisma/) via node resolution up to /app/node_modules/
RUN npm install

# Generate Prisma client (schema at /app/prisma/, client found at /app/node_modules/)
RUN npx prisma generate --schema=prisma/schema.prisma

# Build TypeScript - resolves @prisma/client upward from /app/server/ to /app/node_modules/
RUN npx tsc --project server/tsconfig.json

# Production image
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY prisma ./prisma
COPY server/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/index.js"]
