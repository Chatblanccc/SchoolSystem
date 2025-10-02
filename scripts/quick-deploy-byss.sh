#!/bin/bash
# BYSS 学校管理系统 - 快速部署脚本
# 针对 byss.cmuhe.com 的定制化部署

set -e

echo "=========================================="
echo "BYSS 学校管理系统 - 快速部署"
echo "域名: byss.cmuhe.com"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查是否在正确的目录
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}错误: 请在项目根目录执行此脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/9] 配置环境变量...${NC}"
if [ ! -f ".env" ]; then
    cp env.example .env
    echo "已创建 .env 文件"
else
    echo ".env 文件已存在，跳过"
fi

# 生成 SECRET_KEY
echo -e "${YELLOW}[2/9] 生成 Django SECRET_KEY...${NC}"
SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())" 2>/dev/null || echo "")

if [ -z "$SECRET_KEY" ]; then
    echo -e "${RED}警告: 无法自动生成 SECRET_KEY，需要手动配置${NC}"
else
    sed -i "s|SECRET_KEY=.*|SECRET_KEY=$SECRET_KEY|" .env
    echo "SECRET_KEY 已生成"
fi

# 更新配置
echo -e "${YELLOW}[3/9] 更新配置文件...${NC}"
sed -i "s|ALLOWED_HOSTS=.*|ALLOWED_HOSTS=byss.cmuhe.com,139.159.215.228|" .env
sed -i "s|CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=http://byss.cmuhe.com|" .env
echo "配置文件已更新"

# 提示输入数据库密码
echo -e "${YELLOW}[4/9] 配置数据库密码...${NC}"
read -sp "请输入数据库密码（默认: 1997yx0912）: " DB_PASS
echo ""
if [ -z "$DB_PASS" ]; then
    DB_PASS="1997yx0912"
fi
sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASS|" .env
echo "数据库密码已配置"

# 修改 Nginx 配置
echo -e "${YELLOW}[5/9] 配置 Docker Nginx...${NC}"
sed -i 's/server_name .*/server_name byss.cmuhe.com;/' docker/nginx/prod.conf
echo "Docker Nginx 配置已更新"

# 配置服务器 Nginx
echo -e "${YELLOW}[6/9] 配置服务器 Nginx...${NC}"
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

# 启用 Nginx 配置
sudo ln -sf /etc/nginx/sites-available/byss /etc/nginx/sites-enabled/
echo "Nginx 配置文件已创建"

# 测试 Nginx 配置
echo -e "${YELLOW}测试 Nginx 配置...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}Nginx 配置测试通过${NC}"
    sudo systemctl reload nginx
    echo "Nginx 已重载"
else
    echo -e "${RED}Nginx 配置测试失败，请检查配置${NC}"
    exit 1
fi

# 设置脚本权限
echo -e "${YELLOW}[7/9] 设置脚本权限...${NC}"
chmod +x scripts/*.sh
echo "脚本权限已设置"

# 部署项目
echo -e "${YELLOW}[8/9] 部署 Docker 容器（这可能需要几分钟）...${NC}"
./scripts/deploy.sh

# 检查容器状态
echo -e "${YELLOW}[9/9] 检查容器状态...${NC}"
sleep 5
docker-compose -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}=========================================="
echo "部署完成！"
echo "==========================================${NC}"
echo ""
echo "访问地址:"
echo "  - 前端: http://byss.cmuhe.com"
echo "  - 后台: http://byss.cmuhe.com/admin"
echo "  - 或IP: http://139.159.215.228:8080"
echo ""
echo "下一步操作:"
echo "1. 创建管理员账号:"
echo "   docker exec -it byss-backend python manage.py createsuperuser --settings=config.settings_prod"
echo ""
echo "2. 配置 HTTPS (推荐):"
echo "   sudo certbot --nginx -d byss.cmuhe.com"
echo ""
echo "3. 设置自动备份:"
echo "   crontab -e"
echo "   添加: 0 2 * * * cd /var/www/byss && ./scripts/backup.sh"
echo ""
echo "查看日志: docker-compose -f docker-compose.prod.yml logs -f"
echo ""

