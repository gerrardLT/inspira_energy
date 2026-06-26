# 部署指南

## 架构概览

```
GitHub (push main) → GitHub Actions → SSH 到服务器 → Docker Compose 重建
```

```
用户 → Nginx (443/SSL) → Next.js 容器 (3000) → PostgreSQL + Redis (内部网络)
```

## 首次部署步骤

### 1. GitHub 仓库配置 Secret

进入 GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret，添加两个：

| Name | 说明 |
|------|------|
| `SSH_PRIVATE_KEY` | GitHub Actions 登录服务器的 SSH 私钥 |
| `GH_PAT` | GitHub Personal Access Token，用于服务器 git clone/pull 私有仓库 |

### 2. 服务器初始化

SSH 登录服务器后执行（需传入 PAT）：

```bash
export GH_PAT=你的GitHubToken
curl -fsSL https://你的token@raw.githubusercontent.com/gerrardLT/inspira_energy/main/deploy/server-init.sh | GH_PAT=$GH_PAT bash
```

或先手动克隆后执行：

```bash
GH_PAT=你的GitHubToken bash deploy/server-init.sh
```

### 3. 配置环境变量

```bash
nano /www/wwwroot/inspira_energy/.env
```

必须填入的值：
- `POSTGRES_PASSWORD` — 数据库密码（强密码）
- `SMTP_*` — 邮件服务器配置
- `ADMIN_API_KEY` — 管理 API 密钥

### 4. 申请 SSL 证书

在宝塔面板中：
1. 网站 → 添加站点 → 域名: inspira.energy
2. SSL → Let's Encrypt → 申请
3. 或使用命令行申请

### 5. 重启 Nginx

```bash
nginx -t && nginx -s reload
```

## 日常运维

### 查看日志

```bash
cd /www/wwwroot/inspira_energy
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f postgres
```

### 手动重新部署

```bash
cd /www/wwwroot/inspira_energy
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build app
```

### 数据库备份

```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U inspira inspira_energy > backup_$(date +%Y%m%d).sql
```

### 健康检查

```bash
curl -s https://inspira.energy/api/health | python3 -m json.tool
```

## CI/CD 流程说明

每次推送到 `main` 分支后自动触发：

1. **check** — TypeScript 类型检查 + ESLint
2. **deploy** — SSH 到服务器执行：
   - `git pull` 拉取最新代码
   - `docker compose build` 重新构建镜像
   - `docker compose up -d` 滚动更新
   - 自动执行数据库迁移

## 故障排查

| 问题 | 排查命令 |
|------|----------|
| 容器未启动 | `docker compose -f docker-compose.prod.yml ps` |
| 应用日志 | `docker compose -f docker-compose.prod.yml logs app --tail 50` |
| 数据库连接 | `docker compose -f docker-compose.prod.yml exec postgres psql -U inspira -d inspira_energy -c "SELECT 1"` |
| Nginx 错误 | `tail -f /www/wwwlogs/inspira.energy.error.log` |
| 磁盘空间 | `df -h && docker system df` |
| 清理旧镜像 | `docker system prune -af` |
