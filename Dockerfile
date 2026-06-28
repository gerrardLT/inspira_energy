# ─── Stage 1: Build ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# 使用国内镜像源加速依赖下载
RUN npm config set registry https://registry.npmmirror.com

COPY package.json package-lock.json* ./
# 配置下载超时与重试，避免单个 tarball 卡死导致整个 install 挂起
# --loglevel=http 输出每个包的下载请求，便于观察进度（证明未卡死）
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm install --no-audit --no-fund --legacy-peer-deps --loglevel=http

COPY . .

# 提高 Node 构建堆内存上限，防止重型 3D 依赖（three/r3f）构建时 OOM
ENV NODE_OPTIONS=--max-old-space-size=4096

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

# ─── Stage 2: Production ─────────────────────────────────────────────────────────
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
