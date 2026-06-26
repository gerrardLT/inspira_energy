#!/bin/bash
# ─── 服务器首次部署初始化脚本 ──────────────────────────────────────────────────────
# 在服务器上以 root 用户执行一次即可
# 用法: GH_PAT=你的token bash server-init.sh
#
# 前提：Ubuntu 24 + 宝塔面板已安装
# ─────────────────────────────────────────────────────────────────────────────────

set -e

DEPLOY_PATH="/www/wwwroot/inspira_energy"
DOMAIN="inspira.energy"

# 检查 PAT 是否提供（私有仓库 clone 需要）
if [ -z "$GH_PAT" ]; then
  echo "❌ 缺少 GH_PAT 环境变量。用法: GH_PAT=你的token bash server-init.sh"
  exit 1
fi
REPO_URL="https://${GH_PAT}@github.com/gerrardLT/inspira_energy.git"

echo "=== [1/5] 安装 Docker（如未安装） ==="
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "✅ Docker 已安装"
else
  echo "✅ Docker 已存在: $(docker --version)"
fi

# 确保 docker compose plugin 可用
if ! docker compose version &> /dev/null; then
  apt-get update && apt-get install -y docker-compose-plugin
fi

echo "=== [2/5] 克隆项目代码 ==="
mkdir -p "$DEPLOY_PATH"
cd "$DEPLOY_PATH"
if [ ! -d ".git" ]; then
  git clone "$REPO_URL" .
else
  git remote set-url origin "$REPO_URL"
  git fetch origin main
  git reset --hard origin/main
fi

echo "=== [3/5] 创建 .env 配置文件 ==="
if [ ! -f ".env" ]; then
  cat > .env << 'EOF'
# ─── 数据库 ───────────────────────────────────────────────────────────────────
POSTGRES_PASSWORD=请替换为强密码

# ─── SMTP 邮件 ────────────────────────────────────────────────────────────────
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@inspira.energy
SMTP_PASS=请替换为邮件密码
SMTP_FROM=noreply@inspira.energy

# ─── 邮件收件人 ──────────────────────────────────────────────────────────────
EMAIL_IR_TEAM=ir@inspira.energy
EMAIL_DEV_TEAM=development@inspira.energy
EMAIL_SUPPORT_TEAM=support@inspira.energy

# ─── Admin API ────────────────────────────────────────────────────────────────
ADMIN_API_KEY=请替换为安全的API密钥

# ─── Storage ──────────────────────────────────────────────────────────────────
STORAGE_BACKEND=local

# ─── Webhook（可选）────────────────────────────────────────────────────────────
WEBHOOK_URL=
WEBHOOK_PLATFORM=wechat
EOF
  echo "⚠️  请编辑 .env 文件填入实际配置值: nano $DEPLOY_PATH/.env"
else
  echo "✅ .env 文件已存在"
fi

echo "=== [4/5] 配置 Nginx 反向代理（宝塔面板） ==="
# 宝塔面板的 Nginx 配置路径
NGINX_CONF="/www/server/panel/vhost/nginx/${DOMAIN}.conf"

if [ ! -f "$NGINX_CONF" ]; then
  cat > "$NGINX_CONF" << 'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name inspira.energy www.inspira.energy;

    # Let's Encrypt 验证路径
    location /.well-known/acme-challenge/ {
        root /www/wwwroot/inspira_energy/public;
    }

    # HTTP → HTTPS 重定向
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name inspira.energy www.inspira.energy;

    # SSL 证书路径（宝塔 Let's Encrypt 默认路径）
    ssl_certificate /www/server/panel/vhost/cert/inspira.energy/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/inspira.energy/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;

    # 请求体大小限制（文件上传）
    client_max_body_size 50m;

    # 反向代理到 Next.js 容器
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # 静态资源缓存
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # 健康检查（无需代理缓存）
    location /api/health {
        proxy_pass http://127.0.0.1:3000;
        proxy_no_cache 1;
        proxy_cache_bypass 1;
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
NGINX
  echo "✅ Nginx 配置已创建: $NGINX_CONF"
  echo "⚠️  请通过宝塔面板为 ${DOMAIN} 申请 Let's Encrypt SSL 证书"
  echo "    或运行: /www/server/panel/pyenv/bin/python /www/server/panel/class/acme_v2.py --issue -d ${DOMAIN}"
else
  echo "✅ Nginx 配置已存在"
fi

echo "=== [5/5] 首次构建并启动 ==="
cd "$DEPLOY_PATH"
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ 服务器初始化完成！"
echo ""
echo "  接下来请完成以下步骤："
echo "  1. 编辑 .env 文件: nano $DEPLOY_PATH/.env"
echo "  2. 在宝塔面板中申请 Let's Encrypt SSL 证书"
echo "  3. 重启 Nginx: nginx -s reload"
echo "  4. 在 GitHub 仓库设置 Secret:"
echo "     Settings → Secrets → Actions → New:"
echo "     Name: SERVER_PASSWORD"
echo "     Value: (你的服务器密码)"
echo ""
echo "  验证部署: curl https://inspira.energy/api/health"
echo "═══════════════════════════════════════════════════════════════"
