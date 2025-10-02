#!/bin/bash
# BYSS School Management System - 部署脚本
# 用途：在华为云服务器上部署应用

set -e  # 遇到错误立即退出

echo "=========================================="
echo "BYSS 学校管理系统 - 生产环境部署"
echo "=========================================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误: Docker Compose 未安装，请先安装 Docker Compose${NC}"
    exit 1
fi

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}警告: .env 文件不存在，从模板创建...${NC}"
    cp .env.example .env
    echo -e "${RED}请编辑 .env 文件，填写正确的配置信息后再次运行此脚本${NC}"
    exit 1
fi

# 停止旧容器
echo -e "${YELLOW}[1/7] 停止旧容器...${NC}"
docker-compose -f docker-compose.prod.yml down || true

# 拉取最新代码
echo -e "${YELLOW}[2/7] 拉取最新代码...${NC}"
git pull origin main

# 构建镜像
echo -e "${YELLOW}[3/7] 构建 Docker 镜像...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

# 启动数据库和 Redis
echo -e "${YELLOW}[4/7] 启动数据库和 Redis...${NC}"
docker-compose -f docker-compose.prod.yml up -d mysql redis

# 等待数据库启动
echo -e "${YELLOW}等待数据库启动...${NC}"
sleep 10

# 运行数据库迁移
echo -e "${YELLOW}[5/7] 运行数据库迁移...${NC}"
docker-compose -f docker-compose.prod.yml run --rm --network byss_byss-network backend python manage.py migrate --settings=config.settings_prod

# 收集静态文件
echo -e "${YELLOW}[6/7] 收集静态文件...${NC}"
docker-compose -f docker-compose.prod.yml run --rm --network byss_byss-network backend python manage.py collectstatic --noinput --settings=config.settings_prod

# 启动所有服务
echo -e "${YELLOW}[7/7] 启动所有服务...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# 显示容器状态
echo ""
echo -e "${GREEN}=========================================="
echo "部署完成！"
echo "==========================================${NC}"
echo ""
docker-compose -f docker-compose.prod.yml ps
echo ""
echo -e "${GREEN}访问地址: http://your-server-ip${NC}"
echo -e "${YELLOW}查看日志: docker-compose -f docker-compose.prod.yml logs -f${NC}"
echo ""

