#!/bin/bash
# BYSS School Management System - 数据库恢复脚本

set -e

if [ -z "$1" ]; then
    echo "用法: ./restore.sh <备份文件路径>"
    echo "示例: ./restore.sh /var/backups/byss/byss_backup_20250101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "错误: 备份文件不存在: ${BACKUP_FILE}"
    exit 1
fi

echo "=========================================="
echo "BYSS 学校管理系统 - 数据库恢复"
echo "=========================================="
echo ""
echo "警告: 此操作将覆盖当前数据库！"
echo "备份文件: ${BACKUP_FILE}"
echo ""
read -p "确定要继续吗？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "操作已取消"
    exit 0
fi

# 从 .env 读取数据库配置
source .env

# 解压备份文件（如果是压缩的）
if [[ ${BACKUP_FILE} == *.gz ]]; then
    echo "正在解压备份文件..."
    gunzip -c ${BACKUP_FILE} > /tmp/restore_temp.sql
    SQL_FILE="/tmp/restore_temp.sql"
else
    SQL_FILE=${BACKUP_FILE}
fi

# 执行恢复
echo "正在恢复数据库..."
docker exec -i byss-mysql mysql -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < ${SQL_FILE}

# 清理临时文件
if [ -f "/tmp/restore_temp.sql" ]; then
    rm /tmp/restore_temp.sql
fi

echo ""
echo "数据库恢复完成！"

