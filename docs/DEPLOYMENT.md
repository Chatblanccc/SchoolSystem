# BYSS 学校管理系统 - 部署文档

## 目录
- [服务器要求](#服务器要求)
- [部署架构](#部署架构)
- [首次部署](#首次部署)
- [日常维护](#日常维护)
- [监控和日志](#监控和日志)
- [备份和恢复](#备份和恢复)
- [故障排查](#故障排查)
- [安全建议](#安全建议)

---

## 服务器要求

### 最低配置
- **CPU**: 2核
- **内存**: 4GB
- **存储**: 40GB SSD
- **带宽**: 5Mbps
- **操作系统**: Ubuntu 20.04 LTS / Ubuntu 22.04 LTS

### 推荐配置（生产环境）
- **CPU**: 4核+
- **内存**: 8GB+
- **存储**: 100GB SSD
- **带宽**: 10Mbps+
- **操作系统**: Ubuntu 22.04 LTS

---

## 部署架构

```
Internet
    ↓
[Nginx (Port 80/443)]
    ↓
[Frontend Container (React + Nginx)]
    ↓
[Backend Container (Django + Gunicorn)]
    ↓
[MySQL Container] + [Redis Container]
```

### 容器说明
- **nginx**: 反向代理和负载均衡
- **frontend**: React 前端应用
- **backend**: Django 后端 API
- **mysql**: MySQL 8.0 数据库
- **redis**: Redis 缓存和会话存储

---

## 首次部署

### 1. 准备华为云服务器

#### 1.1 购买和配置服务器
1. 登录华为云控制台
2. 购买 ECS 云服务器（推荐使用通用计算型）
3. 选择操作系统：Ubuntu 22.04 LTS
4. 配置安全组规则：
   - 开放端口 22 (SSH)
   - 开放端口 80 (HTTP)
   - 开放端口 443 (HTTPS，如使用 SSL）

#### 1.2 连接到服务器
```bash
# 使用 SSH 连接到服务器
ssh root@your-server-ip

# 或使用密钥登录
ssh -i your-key.pem root@your-server-ip
```

### 2. 初始化服务器环境

#### 2.1 创建非 root 用户（推荐）
```bash
# 创建用户
adduser byss

# 添加 sudo 权限
usermod -aG sudo byss

# 切换到新用户
su - byss
```

#### 2.2 运行初始化脚本
```bash
# 下载项目（或通过 Git 克隆）
git clone https://github.com/your-repo/SchoolSystem.git /var/www/byss
cd /var/www/byss

# 运行初始化脚本
chmod +x scripts/*.sh
./scripts/init-server.sh

# 重新登录以使 docker 组权限生效
exit
ssh byss@your-server-ip
```

### 3. 配置环境变量

```bash
cd /var/www/byss

# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

**重要配置项**：
```bash
# Django 密钥（必须更改！）
SECRET_KEY=your-random-secret-key-here

# 允许的主机
ALLOWED_HOSTS=your-domain.com,your-server-ip

# 数据库配置
DB_NAME=byss
DB_USER=root
DB_PASSWORD=your-strong-password-here

# CORS 配置
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

**生成 Django 密钥**：
```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 4. 配置域名（可选）

如果使用域名访问：

1. 在域名服务商处添加 A 记录，指向服务器 IP
2. 编辑 `docker/nginx/prod.conf`，修改 `server_name`：
   ```nginx
   server_name your-domain.com www.your-domain.com;
   ```

### 5. 配置 SSL 证书（可选）

#### 使用 Let's Encrypt 免费证书
```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 申请证书
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 证书路径
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem

# 将证书复制到项目目录
sudo mkdir -p docker/nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/nginx/ssl/key.pem
sudo chown -R $USER:$USER docker/nginx/ssl

# 启用 HTTPS 配置
# 编辑 docker/nginx/prod.conf，取消注释 HTTPS server 块
```

### 6. 执行部署

```bash
cd /var/www/byss

# 运行部署脚本
./scripts/deploy.sh
```

部署脚本会自动执行以下操作：
1. 停止旧容器
2. 拉取最新代码
3. 构建 Docker 镜像
4. 启动数据库和 Redis
5. 运行数据库迁移
6. 收集静态文件
7. 启动所有服务

### 7. 验证部署

```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 所有容器应该显示 "Up" 状态
```

访问应用：
- HTTP: `http://your-server-ip` 或 `http://your-domain.com`
- HTTPS: `https://your-domain.com` (如果配置了 SSL)

### 8. 创建超级管理员

```bash
# 进入后端容器
docker exec -it byss-backend bash

# 创建超级用户
python manage.py createsuperuser --settings=config.settings_prod

# 退出容器
exit
```

---

## 日常维护

### 更新应用

```bash
cd /var/www/byss

# 运行更新脚本
./scripts/update.sh
```

### 重启服务

```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启单个服务
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend
```

### 停止和启动

```bash
# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d
```

---

## 监控和日志

### 查看日志

```bash
# 查看所有服务日志
./scripts/logs.sh

# 查看特定服务日志
./scripts/logs.sh backend
./scripts/logs.sh frontend
./scripts/logs.sh mysql
./scripts/logs.sh redis

# 或使用 docker-compose 命令
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 查看容器状态

```bash
# 查看所有容器状态
docker ps

# 查看容器资源使用情况
docker stats
```

### 进入容器调试

```bash
# 进入后端容器
docker exec -it byss-backend bash

# 进入数据库容器
docker exec -it byss-mysql mysql -u root -p

# 进入 Redis 容器
docker exec -it byss-redis redis-cli
```

---

## 备份和恢复

### 数据库备份

#### 手动备份
```bash
cd /var/www/byss
./scripts/backup.sh
```

备份文件保存在 `/var/backups/byss/` 目录

#### 自动备份（使用 crontab）
```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天凌晨 2 点备份）
0 2 * * * cd /var/www/byss && ./scripts/backup.sh >> /var/log/byss/backup.log 2>&1
```

### 数据库恢复

```bash
cd /var/www/byss
./scripts/restore.sh /var/backups/byss/byss_backup_20250101_120000.sql.gz
```

### 备份文件和媒体文件

```bash
# 备份媒体文件
docker cp byss-backend:/app/media ./media_backup_$(date +%Y%m%d)

# 备份静态文件
docker cp byss-backend:/app/staticfiles ./static_backup_$(date +%Y%m%d)
```

---

## 故障排查

### 问题：容器无法启动

```bash
# 查看容器日志
docker-compose -f docker-compose.prod.yml logs

# 检查容器状态
docker-compose -f docker-compose.prod.yml ps

# 重新构建并启动
docker-compose -f docker-compose.prod.yml up -d --build
```

### 问题：数据库连接失败

```bash
# 检查 MySQL 容器状态
docker ps | grep mysql

# 查看 MySQL 日志
docker logs byss-mysql

# 进入 MySQL 容器检查
docker exec -it byss-mysql mysql -u root -p

# 验证数据库是否存在
SHOW DATABASES;
```

### 问题：静态文件无法加载

```bash
# 重新收集静态文件
docker-compose -f docker-compose.prod.yml run --rm backend \
    python manage.py collectstatic --noinput --settings=config.settings_prod

# 检查静态文件卷
docker volume ls
docker volume inspect schoolsystem_static_volume
```

### 问题：前端无法访问后端 API

1. 检查 Nginx 配置：`docker/nginx/prod.conf`
2. 检查后端日志：`docker logs byss-backend`
3. 检查网络连接：`docker network ls`

### 问题：磁盘空间不足

```bash
# 查看磁盘使用情况
df -h

# 清理 Docker 未使用的资源
docker system prune -a

# 清理旧的日志文件
find /var/log -name "*.log" -mtime +30 -delete

# 清理旧的备份文件
find /var/backups/byss -name "*.sql.gz" -mtime +30 -delete
```

---

## 安全建议

### 1. 服务器安全

#### 配置防火墙
```bash
# 启用 UFW 防火墙
sudo ufw enable

# 只开放必要端口
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# 查看防火墙状态
sudo ufw status
```

#### 禁用 root 登录
```bash
# 编辑 SSH 配置
sudo vim /etc/ssh/sshd_config

# 修改以下配置
PermitRootLogin no
PasswordAuthentication no  # 强制使用密钥登录

# 重启 SSH 服务
sudo systemctl restart sshd
```

#### 配置 Fail2ban（防暴力破解）
```bash
# 安装 Fail2ban
sudo apt-get install fail2ban

# 启动服务
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. 应用安全

#### 更改默认密钥
- 确保 `.env` 中的 `SECRET_KEY` 是唯一的强密钥
- 使用强密码保护数据库

#### 限制 ALLOWED_HOSTS
```python
# .env
ALLOWED_HOSTS=your-domain.com,your-server-ip
```

#### 启用 HTTPS
- 使用 Let's Encrypt 免费 SSL 证书
- 强制 HTTPS 重定向

#### 定期更新
```bash
# 更新系统软件包
sudo apt-get update && sudo apt-get upgrade

# 更新 Docker 镜像
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### 3. 数据安全

- 定期备份数据库
- 备份文件加密存储
- 限制数据库访问权限
- 使用华为云对象存储（OBS）存储备份

---

## 性能优化

### 1. 数据库优化

```bash
# 编辑 MySQL 配置
vim docker/mysql/my.cnf

# 根据服务器配置调整参数
innodb_buffer_pool_size=512M  # 内存的 50-70%
max_connections=200
```

### 2. Redis 优化

```bash
# 编辑 Redis 配置
vim docker/redis/redis.conf

# 调整最大内存
maxmemory 512mb
maxmemory-policy allkeys-lru
```

### 3. 应用优化

- 启用 Django 缓存
- 使用 CDN 加速静态文件
- 配置 Nginx 缓存
- 启用 Gzip 压缩

---

## 监控告警（可选）

### 使用 Prometheus + Grafana

```bash
# 在 docker-compose.prod.yml 中添加监控服务
# 详细配置请参考官方文档
```

### 使用华为云监控

1. 登录华为云控制台
2. 进入"云监控服务 CES"
3. 配置告警规则：
   - CPU 使用率 > 80%
   - 内存使用率 > 85%
   - 磁盘使用率 > 90%

---

## 常用命令速查

```bash
# 部署
./scripts/deploy.sh

# 更新
./scripts/update.sh

# 备份
./scripts/backup.sh

# 恢复
./scripts/restore.sh <备份文件>

# 查看日志
./scripts/logs.sh [服务名]

# 查看状态
docker-compose -f docker-compose.prod.yml ps

# 重启服务
docker-compose -f docker-compose.prod.yml restart [服务名]

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

---

## 支持和联系

如有问题，请联系：
- **技术支持**: support@example.com
- **文档**: https://github.com/your-repo/SchoolSystem/wiki
- **Issue**: https://github.com/your-repo/SchoolSystem/issues

---

**最后更新**: 2025-10-02  
**文档版本**: v1.0.0

