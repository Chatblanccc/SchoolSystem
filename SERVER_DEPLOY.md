# BYSS 学校管理系统 - 服务器部署指南

## 📋 服务器环境说明

本项目已针对**已有项目运行的服务器**进行配置优化，端口分配如下：

### 端口分配
- **MySQL**: 3308 (避免与原项目的 3307 冲突)
- **Redis**: 6380 (避免与原项目的 6379 冲突)
- **Nginx**: 8080 (Docker 容器端口，通过系统 Nginx 转发到 80)
- **HTTPS**: 8443 (通过系统 Nginx 转发到 443)

### 原项目端口占用情况
- 80 端口: 原项目前端 (cmuhe.com)
- 8000 端口: 原项目后端
- 3307 端口: 原项目 MySQL
- 6379 端口: 原项目 Redis

---

## 🚀 快速部署步骤

### 前提条件
- ✅ DNS 已配置：byss.cmuhe.com → 服务器 IP
- ✅ 服务器可通过 SSH 访问
- ✅ Docker 和 Docker Compose 已安装

---

### 步骤 1: 克隆项目

```bash
# SSH 连接到服务器
ssh root@your-server-ip

# 克隆项目到服务器
cd /var
git clone https://github.com/your-username/SchoolSystem.git byss
cd byss
```

---

### 步骤 2: 安装系统 Nginx（如果未安装）

```bash
# 检查是否已安装
which nginx

# 如果未安装，执行：
apt update
apt install nginx -y

# 启动 Nginx
systemctl start nginx
systemctl enable nginx
```

---

### 步骤 3: 配置环境变量

```bash
# 复制环境变量模板
cp env.example .env

# 生成 SECRET_KEY
python3 -c "import secrets; print('django-insecure-' + secrets.token_urlsafe(50))"

# 编辑 .env 文件
vim .env
```

**必须修改的配置**：

```bash
# 1. SECRET_KEY（粘贴上面生成的密钥）
SECRET_KEY=django-insecure-刚才生成的密钥

# 2. ALLOWED_HOSTS（添加你的域名和服务器 IP）
ALLOWED_HOSTS=byss.cmuhe.com,139.159.215.228

# 3. 数据库密码（设置强密码）
DB_PASSWORD=your-strong-password-here

# 4. CORS 配置
CORS_ALLOWED_ORIGINS=http://byss.cmuhe.com
```

保存退出：`ESC` → `:wq`

---

### 步骤 4: 配置系统 Nginx

#### 4.1 为新项目创建配置

```bash
sudo tee /etc/nginx/sites-available/byss > /dev/null <<'EOF'
server {
    listen 80;
    server_name byss.cmuhe.com;

    access_log /var/log/nginx/byss-access.log;
    error_log /var/log/nginx/byss-error.log;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
```

#### 4.2 为原项目创建配置（如果还没有）

```bash
sudo tee /etc/nginx/sites-available/cmuhe > /dev/null <<'EOF'
server {
    listen 80 default_server;
    server_name cmuhe.com www.cmuhe.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

#### 4.3 启用配置

```bash
# 启用新项目配置
sudo ln -s /etc/nginx/sites-available/byss /etc/nginx/sites-enabled/

# 启用原项目配置（如果需要）
sudo ln -s /etc/nginx/sites-available/cmuhe /etc/nginx/sites-enabled/

# 删除默认配置
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 如果测试通过，重载 Nginx
sudo systemctl reload nginx
```

---

### 步骤 5: 修改 Docker Nginx 配置

```bash
# 编辑 Docker Nginx 配置，修改域名
vim docker/nginx/prod.conf
```

找到 `server_name` 行，修改为：

```nginx
server_name byss.cmuhe.com;
```

保存退出

---

### 步骤 6: 部署项目

```bash
# 给脚本执行权限
chmod +x scripts/*.sh

# 执行部署脚本
./scripts/deploy.sh
```

部署脚本会自动：
- 停止旧容器
- 构建 Docker 镜像
- 启动所有服务（MySQL, Redis, Backend, Frontend, Nginx）
- 运行数据库迁移
- 收集静态文件

---

### 步骤 7: 检查容器状态

```bash
# 查看所有容器
docker-compose -f docker-compose.prod.yml ps

# 应该看到所有容器都是 Up 状态
# NAME              STATUS
# byss-backend      Up
# byss-frontend     Up  
# byss-mysql        Up
# byss-nginx        Up
# byss-redis        Up

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

---

### 步骤 8: 创建超级管理员

```bash
docker exec -it byss-backend python manage.py createsuperuser --settings=config.settings_prod

# 按提示输入：
# - 用户名
# - 邮箱
# - 密码（输入时不显示）
```

---

### 步骤 9: 测试访问

在浏览器访问：

```
http://byss.cmuhe.com           # 前端首页
http://byss.cmuhe.com/admin     # 后台管理
```

---

## 🔒 配置 HTTPS（推荐）

### 安装 Certbot

```bash
apt update
apt install certbot python3-certbot-nginx -y
```

### 申请 SSL 证书

```bash
# 为新项目申请证书
sudo certbot --nginx -d byss.cmuhe.com

# 按提示操作：
# 1. 输入邮箱
# 2. 同意服务条款 (Y)
# 3. 是否接收新闻 (N)
# 4. 选择是否强制 HTTPS (推荐选 2 - Redirect)
```

### 更新 CORS 配置

```bash
cd /var/byss
vim .env

# 修改为 HTTPS
CORS_ALLOWED_ORIGINS=https://byss.cmuhe.com
```

### 重启后端容器

```bash
docker-compose -f docker-compose.prod.yml restart backend
```

现在可以通过 `https://byss.cmuhe.com` 访问了！🔒

---

## 📊 系统架构

```
Internet
   ↓
DNS: byss.cmuhe.com → 139.159.215.228
   ↓
[系统 Nginx - Port 80/443]
   ├── cmuhe.com              → localhost:80 (原项目)
   └── byss.cmuhe.com         → localhost:8080 (新项目)
                                      ↓
                                [Docker Nginx:8080]
                                      ↓
                    ┌─────────────────┼─────────────────┐
                    ↓                 ↓                 ↓
              [Frontend]        [Backend:8000]    [MySQL:3308]
                                                  [Redis:6380]
```

---

## 🔧 常用维护命令

```bash
# 项目目录
cd /var/byss

# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f [service_name]

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 更新应用
./scripts/update.sh

# 备份数据库
./scripts/backup.sh

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/byss-access.log
sudo tail -f /var/log/nginx/byss-error.log

# 测试 Nginx 配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

---

## 🛠️ 故障排查

### 问题 1: 访问域名跳转到原网站

**原因**: Nginx 配置未生效

**解决**:
```bash
sudo nginx -t
sudo systemctl reload nginx
ls -la /etc/nginx/sites-enabled/
```

### 问题 2: 502 Bad Gateway

**原因**: Docker 容器未启动

**解决**:
```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml restart
docker-compose -f docker-compose.prod.yml logs
```

### 问题 3: 端口冲突

**原因**: 端口被其他服务占用

**解决**:
```bash
netstat -tulpn | grep -E ':8080|:3308|:6380'
# 修改 docker-compose.prod.yml 中的端口
```

### 问题 4: 数据库连接失败

**原因**: 数据库密码错误或容器未启动

**解决**:
```bash
docker-compose -f docker-compose.prod.yml logs mysql
docker exec -it byss-mysql mysql -u root -p
```

---

## 📦 自动备份设置

```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天凌晨 3 点备份，避开原项目备份时间）
0 3 * * * cd /var/byss && ./scripts/backup.sh >> /var/log/byss/backup.log 2>&1
```

---

## ✅ 部署检查清单

- [ ] DNS 解析生效 (`ping byss.cmuhe.com`)
- [ ] 项目已克隆到 `/var/byss`
- [ ] `.env` 配置正确（SECRET_KEY, ALLOWED_HOSTS, DB_PASSWORD）
- [ ] 系统 Nginx 已安装并配置
- [ ] Docker 容器全部运行正常
- [ ] 可以访问 `http://byss.cmuhe.com`
- [ ] 可以登录后台 `/admin`
- [ ] SSL 证书已配置（推荐）
- [ ] 自动备份已设置

---

## 📞 技术支持

- 详细文档：[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- 快速部署：[QUICK_DEPLOY.md](QUICK_DEPLOY.md)
- 项目说明：[README.md](README.md)

---

**最后更新**: 2025-10-02  
**版本**: v2.0.0 - 多项目共存版

