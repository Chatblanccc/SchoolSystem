#!/bin/bash
# BYSS School Management System - 华为云服务器初始化脚本
# 用途：首次部署时在服务器上配置环境

set -e

echo "=========================================="
echo "BYSS 学校管理系统 - 服务器初始化"
echo "=========================================="

# 更新系统
echo "[1/6] 更新系统软件包..."
sudo apt-get update
sudo apt-get upgrade -y

# 安装必要工具
echo "[2/6] 安装必要工具..."
sudo apt-get install -y \
    git \
    curl \
    wget \
    vim \
    htop \
    net-tools \
    ca-certificates \
    gnupg \
    lsb-release

# 安装 Docker
echo "[3/6] 安装 Docker..."
if ! command -v docker &> /dev/null; then
    # 添加 Docker 官方 GPG 密钥
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # 添加 Docker 仓库
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # 安装 Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # 将当前用户添加到 docker 组
    sudo usermod -aG docker $USER
    
    echo "Docker 安装完成！"
else
    echo "Docker 已安装"
fi

# 安装 Docker Compose
echo "[4/6] 安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose 安装完成！"
else
    echo "Docker Compose 已安装"
fi

# 配置防火墙
echo "[5/6] 配置防火墙..."
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
echo "防火墙规则已配置"

# 创建项目目录
echo "[6/6] 创建项目目录..."
sudo mkdir -p /var/www/byss
sudo mkdir -p /var/backups/byss
sudo mkdir -p /var/log/byss
sudo chown -R $USER:$USER /var/www/byss
sudo chown -R $USER:$USER /var/backups/byss
sudo chown -R $USER:$USER /var/log/byss

echo ""
echo "=========================================="
echo "服务器初始化完成！"
echo "=========================================="
echo ""
echo "下一步操作："
echo "1. 克隆项目代码到 /var/www/byss"
echo "2. 配置 .env 文件"
echo "3. 运行 ./scripts/deploy.sh 部署应用"
echo ""
echo "注意: 请重新登录以使 docker 组权限生效"

