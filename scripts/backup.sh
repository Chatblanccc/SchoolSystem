#!/bin/bash
# BYSS School Management System - 数据库备份脚本

set -e

echo "=========================================="
echo "BYSS 学校管理系统 - 数据库备份"
echo "=========================================="

# 配置
BACKUP_DIR="/var/backups/byss"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="byss_backup_${DATE}.sql"
DAYS_TO_KEEP=7

# 创建备份目录
mkdir -p ${BACKUP_DIR}

# 从 .env 读取数据库配置
source .env

# 执行备份
echo "正在备份数据库..."
docker exec byss-mysql mysqldump -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > ${BACKUP_DIR}/${BACKUP_FILE}

# 压缩备份文件
echo "正在压缩备份文件..."
gzip ${BACKUP_DIR}/${BACKUP_FILE}

# 删除旧备份
echo "清理旧备份文件..."
find ${BACKUP_DIR} -name "byss_backup_*.sql.gz" -mtime +${DAYS_TO_KEEP} -delete

echo "备份完成: ${BACKUP_DIR}/${BACKUP_FILE}.gz"
echo "保留最近 ${DAYS_TO_KEEP} 天的备份"

