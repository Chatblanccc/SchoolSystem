#!/bin/bash
# BYSS School Management System - 更新脚本
# 用途：在不停机的情况下更新应用

set -e

echo "=========================================="
echo "BYSS 学校管理系统 - 应用更新"
echo "=========================================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 拉取最新代码
echo -e "${YELLOW}[1/5] 拉取最新代码...${NC}"
git pull origin main

# 构建新镜像
echo -e "${YELLOW}[2/5] 构建新镜像...${NC}"
docker-compose -f docker-compose.prod.yml build backend frontend

# 运行数据库迁移
echo -e "${YELLOW}[3/5] 运行数据库迁移...${NC}"
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py migrate --settings=config.settings_prod

# 收集静态文件
echo -e "${YELLOW}[4/5] 收集静态文件...${NC}"
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput --settings=config.settings_prod

# 滚动更新容器
echo -e "${YELLOW}[5/5] 滚动更新容器...${NC}"
docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend frontend

echo ""
echo -e "${GREEN}更新完成！${NC}"
docker-compose -f docker-compose.prod.yml ps

