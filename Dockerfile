# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ─── Stage 2: Build ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# 构建时不需要运行时环境变量，使用占位值通过 env.ts 验证
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV REDIS_HOST=localhost
ENV REDIS_PORT=6379
ENV SMTP_HOST=placeholder
ENV SMTP_PORT=587
ENV SMTP_USER=placeholder
ENV SMTP_PASS=placeholder
ENV SMTP_FROM=placeholder@placeholder.com
ENV EMAIL_IR_TEAM=placeholder@placeholder.com
ENV EMAIL_DEV_TEAM=placeholder@placeholder.com
ENV EMAIL_SUPPORT_TEAM=placeholder@placeholder.com
ENV UPLOAD_DIR=/app/uploads
ENV CORS_ORIGIN=https://placeholder.com

RUN npm run build

# ─── Stage 3: Production ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 安全：使用非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 复制迁移文件（运行时执行迁移）
COPY --from=builder /app/src/lib/db/migrations ./src/lib/db/migrations
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# 创建上传目录
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
