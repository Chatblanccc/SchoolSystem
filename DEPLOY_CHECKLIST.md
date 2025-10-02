# BYSS 学校管理系统 - 部署前检查清单

## 📋 上传到 Git 前检查

### 1. 环境配置文件
- [x] ✅ `env.example` 已创建（模板文件）
- [x] ✅ `.env` 已加入 `.gitignore`（不上传敏感信息）
- [x] ✅ `.gitignore` 配置完整

### 2. Docker 配置
- [x] ✅ `backend/Dockerfile` 已创建
- [x] ✅ `frontend/Dockerfile` 已创建
- [x] ✅ `docker-compose.yml` 已创建（开发环境）
- [x] ✅ `docker-compose.prod.yml` 已创建（生产环境）
- [x] ✅ `.dockerignore` 已创建（前后端）

### 3. Nginx 配置
- [x] ✅ `docker/nginx/nginx.conf` 已创建
- [x] ✅ `docker/nginx/prod.conf` 已创建
- [x] ✅ `frontend/nginx/default.conf` 已创建

### 4. 数据库和缓存配置
- [x] ✅ `docker/mysql/my.cnf` 已创建
- [x] ✅ `docker/redis/redis.conf` 已创建

### 5. 部署脚本
- [x] ✅ `scripts/init-server.sh` 已创建
- [x] ✅ `scripts/deploy.sh` 已创建
- [x] ✅ `scripts/update.sh` 已创建
- [x] ✅ `scripts/backup.sh` 已创建
- [x] ✅ `scripts/restore.sh` 已创建
- [x] ✅ `scripts/logs.sh` 已创建

### 6. Django 配置
- [x] ✅ `backend/config/settings.py` - 开发环境配置
- [x] ✅ `backend/config/settings_prod.py` - 生产环境配置
- [x] ✅ `backend/requirements.txt` - 依赖清单

### 7. 文档
- [x] ✅ `README.md` - 项目说明
- [x] ✅ `docs/DEPLOYMENT.md` - 部署文档
- [x] ✅ `DEPLOY_CHECKLIST.md` - 本检查清单

---

## 🚀 提交到 Git

```bash
# 在本地执行
cd D:\SchoolSystem

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "feat: 初始化 BYSS 学校管理系统项目

- 添加 Docker 配置和部署脚本
- 添加前后端完整代码
- 添加 Nginx 配置
- 添加部署文档"

# 添加远程仓库（替换成你的仓库地址）
git remote add origin https://github.com/your-username/SchoolSystem.git

# 推送到远程
git branch -M main
git push -u origin main
```

---

## 🖥️ 服务器部署检查

### 阶段 1: 服务器准备

- [ ] 华为云服务器已购买
- [ ] SSH 可以正常连接
- [ ] Docker 已安装（或运行 `scripts/init-server.sh`）
- [ ] Docker Compose 已安装
- [ ] 防火墙/安全组已配置（开放 22, 80, 443 端口）

### 阶段 2: 域名配置

- [ ] DNS 解析已添加：`byss.cmuhe.com` → 服务器 IP
- [ ] DNS 已生效（`ping byss.cmuhe.com` 可通）

### 阶段 3: 服务器 Nginx 配置

- [ ] 创建 `/etc/nginx/sites-available/byss`
- [ ] 软链接到 `/etc/nginx/sites-enabled/`
- [ ] Nginx 配置测试通过（`sudo nginx -t`）
- [ ] Nginx 已重载（`sudo systemctl reload nginx`）

### 阶段 4: 项目部署

- [ ] 项目已克隆到 `/var/www/byss`
- [ ] `.env` 文件已配置
  - [ ] `SECRET_KEY` 已生成新密钥
  - [ ] `ALLOWED_HOSTS` 已设置为 `byss.cmuhe.com`
  - [ ] `DB_PASSWORD` 已设置强密码
  - [ ] `CORS_ALLOWED_ORIGINS` 已正确配置
- [ ] `docker/nginx/prod.conf` 的 `server_name` 已改为 `byss.cmuhe.com`
- [ ] `docker-compose.prod.yml` 端口配置正确（8080:80）
- [ ] 部署脚本已执行（`./scripts/deploy.sh`）
- [ ] 所有 Docker 容器正常运行

### 阶段 5: 应用配置

- [ ] 创建了 Django 超级用户
- [ ] 可以访问 `http://byss.cmuhe.com`
- [ ] 可以访问 `http://byss.cmuhe.com/admin`
- [ ] 数据库连接正常
- [ ] Redis 缓存正常

### 阶段 6: SSL 证书（推荐）

- [ ] Certbot 已安装
- [ ] SSL 证书已申请（`sudo certbot --nginx -d byss.cmuhe.com`）
- [ ] HTTPS 访问正常
- [ ] `.env` 的 `CORS_ALLOWED_ORIGINS` 已改为 `https://`
- [ ] 强制 HTTPS 重定向已启用

### 阶段 7: 安全加固

- [ ] 数据库使用强密码
- [ ] SSH 使用密钥登录（禁用密码登录）
- [ ] 防火墙已启用（UFW）
- [ ] 定期备份已配置（crontab）
- [ ] 日志轮转已配置

---

## 🧪 功能测试

### 前端测试
- [ ] 首页可以正常访问
- [ ] 登录功能正常
- [ ] 学生管理页面正常
- [ ] 班级管理页面正常
- [ ] 教师管理页面正常
- [ ] 课程管理页面正常
- [ ] 成绩管理页面正常

### 后端测试
- [ ] API 文档可访问（`/api/schema/swagger-ui/`）
- [ ] JWT 认证正常
- [ ] 数据库操作正常
- [ ] 文件上传功能正常
- [ ] Excel 导入导出正常

### 性能测试
- [ ] 页面加载速度正常（< 3秒）
- [ ] API 响应时间正常（< 200ms）
- [ ] 虚拟化表格滚动流畅
- [ ] 大量数据加载正常

---

## 📊 监控配置（可选）

- [ ] 服务器监控（华为云 CES）
- [ ] 应用日志监控
- [ ] 错误追踪（Sentry）
- [ ] 性能监控

---

## 🔄 日常维护

### 每日
- [ ] 检查应用日志
- [ ] 检查服务器资源使用

### 每周
- [ ] 数据库备份验证
- [ ] 安全更新检查

### 每月
- [ ] SSL 证书到期检查
- [ ] 磁盘空间清理
- [ ] 性能优化评估

---

## 🆘 应急联系

- **服务器供应商**: 华为云客服
- **域名服务商**: [你的域名服务商]
- **技术支持**: [你的联系方式]

---

## 📝 部署记录

| 时间 | 操作 | 执行人 | 备注 |
|------|------|--------|------|
| 2025-10-02 | 初始部署 | - | - |
|  |  |  |  |

---

**最后更新**: 2025-10-02
**维护人**: BYSS 技术团队

