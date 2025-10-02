#!/bin/bash
# BYSS School Management System - 日志查看脚本

SERVICE=${1:-all}

echo "=========================================="
echo "BYSS 学校管理系统 - 日志查看"
echo "=========================================="

if [ "$SERVICE" == "all" ]; then
    docker-compose -f docker-compose.prod.yml logs -f --tail=100
else
    docker-compose -f docker-compose.prod.yml logs -f --tail=100 $SERVICE
fi

