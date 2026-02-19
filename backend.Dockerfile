# Build Stage
FROM node:23-alpine AS builder

WORKDIR /app

# Install PNPM
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Copy workspace packages
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install

# Copy source
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/prisma ./apps/backend/prisma

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN pnpm prisma:generate

# Build Backend
RUN pnpm build

# Production Stage
FROM node:23-alpine AS runner

WORKDIR /app

COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Environment variables (Defaults)
ENV PORT=4000
ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "dist/index.js"]
