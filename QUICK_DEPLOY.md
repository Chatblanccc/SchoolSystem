# BYSS 学校管理系统 - 快速部署指南

## 📌 适用场景
已有华为云服务器，域名为 `cmuhe.com`，为新项目配置子域名 `byss.cmuhe.com`

---

## 🚀 一键部署脚本

### 在服务器上执行（复制整段）

```bash
#!/bin/bash
# BYSS 快速部署脚本
set -e

echo "=========================================="
echo "BYSS 学校管理系统 - 快速部署"
echo "=========================================="

# 1. 克隆项目
echo "[1/8] 克隆项目..."
cd /var/www
git clone https://github.com/your-username/SchoolSystem.git byss
cd byss

# 2. 配置环境变量
echo "[2/8] 配置环境变量..."
cp env.example .env

# 生成 SECRET_KEY
SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")

# 提示用户输入配置
echo ""
echo "请输入以下配置信息："
read -p "数据库密码: " DB_PASSWORD
read -p "服务器 IP: " SERVER_IP

# 更新 .env
sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
sed -i "s/ALLOWED_HOSTS=.*/ALLOWED_HOSTS=byss.cmuhe.com,$SERVER_IP/" .env
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
sed -i "s|CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=http://byss.cmuhe.com|" .env

# 3. 修改 Nginx 配置
echo "[3/8] 配置 Nginx..."
sed -i 's/server_name .*/server_name byss.cmuhe.com;/' docker/nginx/prod.conf

# 4. 创建服务器 Nginx 配置
echo "[4/8] 配置服务器 Nginx..."
sudo tee /etc/nginx/sites-available/byss > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
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

# 5. 启用 Nginx 配置
echo "[5/8] 启用 Nginx 配置..."
sudo ln -sf /etc/nginx/sites-available/byss /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. 给脚本执行权限
echo "[6/8] 设置权限..."
chmod +x scripts/*.sh

# 7. 部署项目
echo "[7/8] 部署项目（这可能需要几分钟）..."
./scripts/deploy.sh

# 8. 创建超级用户
echo "[8/8] 创建超级用户..."
docker exec -it byss-backend python manage.py createsuperuser --settings=config.settings_prod

echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "访问地址: http://byss.cmuhe.com"
echo "管理后台: http://byss.cmuhe.com/admin"
echo ""
echo "下一步："
echo "1. 测试访问应用"
echo "2. 配置 SSL 证书: sudo certbot --nginx -d byss.cmuhe.com"
echo "3. 设置定期备份"
echo ""
```

---

## 📋 分步部署（手动控制）

### 步骤 1: DNS 配置

登录域名服务商，添加 A 记录：
```
类型: A
主机记录: byss
记录值: 你的服务器IP
TTL: 600
```

等待 5-10 分钟，验证：
```bash
ping byss.cmuhe.com
```

---

### 步骤 2: SSH 连接服务器

```bash
ssh your-user@your-server-ip
```

---

### 步骤 3: 克隆项目

```bash
cd /var/www
git clone https://github.com/your-username/SchoolSystem.git byss
cd byss
```

---

### 步骤 4: 配置环境变量

```bash
# 复制模板
cp env.example .env

# 生成密钥
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# 编辑配置
vim .env
```

必须修改的配置：
```bash
SECRET_KEY=生成的密钥
ALLOWED_HOSTS=byss.cmuhe.com,你的服务器IP
DB_PASSWORD=设置强密码
CORS_ALLOWED_ORIGINS=http://byss.cmuhe.com
```

---

### 步骤 5: 修改项目配置

```bash
# 修改 Nginx 配置
vim docker/nginx/prod.conf
# 改 server_name 为: byss.cmuhe.com
```

---

### 步骤 6: 配置服务器 Nginx

```bash
# 创建配置
sudo vim /etc/nginx/sites-available/byss
```

粘贴配置（见上面一键脚本中的 EOF 部分）

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/byss /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 步骤 7: 部署项目

```bash
cd /var/www/byss
chmod +x scripts/*.sh
./scripts/deploy.sh
```

---

### 步骤 8: 创建管理员

```bash
docker exec -it byss-backend python manage.py createsuperuser --settings=config.settings_prod
```

---

### 步骤 9: 测试访问

浏览器访问：
```
http://byss.cmuhe.com
http://byss.cmuhe.com/admin
```

---

### 步骤 10: 配置 SSL（推荐）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# 申请证书
sudo certbot --nginx -d byss.cmuhe.com

# 更新 CORS 配置
vim .env
# 改 CORS_ALLOWED_ORIGINS=https://byss.cmuhe.com

# 重启后端
docker-compose -f docker-compose.prod.yml restart backend
```

---

## ✅ 验证清单

部署完成后，检查：

- [ ] `http://byss.cmuhe.com` 可以访问
- [ ] 可以登录系统
- [ ] 后台管理 `/admin` 可以访问
- [ ] 所有容器运行正常：`docker-compose -f docker-compose.prod.yml ps`
- [ ] 数据库连接正常
- [ ] Redis 缓存正常

---

## 🔧 常用命令

```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 更新应用
./scripts/update.sh

# 备份数据库
./scripts/backup.sh

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/byss-error.log
```

---

## 🆘 故障排查

### 问题: 访问域名跳转到原网站

**原因**: 服务器 Nginx 配置未生效

**解决**:
```bash
sudo nginx -t
sudo systemctl reload nginx
curl -I http://byss.cmuhe.com
```

### 问题: 502 Bad Gateway

**原因**: Docker 容器未启动

**解决**:
```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml restart
```

### 问题: 容器无法启动

**原因**: 配置错误或端口冲突

**解决**:
```bash
docker-compose -f docker-compose.prod.yml logs
# 检查错误信息并修复
```

---

## 📞 需要帮助？

详细文档：
- [完整部署文档](docs/DEPLOYMENT.md)
- [部署检查清单](DEPLOY_CHECKLIST.md)
- [README](README.md)

---

**预计部署时间**: 15-20 分钟  
**难度**: ⭐⭐⭐☆☆

祝部署顺利！🚀

