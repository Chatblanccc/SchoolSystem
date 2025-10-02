# BYSS 学校管理系统

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.11-blue)
![Django](https://img.shields.io/badge/django-4.2-green)
![React](https://img.shields.io/badge/react-18-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.0-blue)

中小学一体化学校管理系统

[功能特性](#功能特性) • [快速开始](#快速开始) • [部署指南](#部署指南) • [文档](#文档) • [贡献指南](#贡献指南)

</div>

---

## 📋 项目简介

BYSS School Management System 是一套完整的中小学学校管理系统，采用前后端分离架构，提供学生管理、教务管理、成绩管理等核心功能。

### 技术栈

**前端**
- React 18 + TypeScript
- Vite 5
- Tailwind CSS
- TanStack Virtual (虚拟化表格)
- Zustand (状态管理)

**后端**
- Django 4.2 + Django REST Framework
- MySQL 8.0
- Redis 7
- JWT 认证
- Celery (异步任务)

**部署**
- Docker + Docker Compose
- Nginx
- Gunicorn

---

## ✨ 功能特性

- ✅ **用户管理**: 多角色用户体系（管理员、教师、学生、家长）
- ✅ **学生管理**: 学籍信息、批量导入导出、虚拟化表格
- ✅ **班级管理**: 班级创建、学生分配、班级统计
- ✅ **教师管理**: 教师信息、授课安排
- ✅ **课程管理**: 课程设置、课程表管理
- ✅ **年级管理**: 年级配置、学期管理
- ✅ **成绩管理**: 成绩录入、成绩分析
- ✅ **数据导入导出**: Excel 批量操作
- ✅ **权限控制**: 基于角色的访问控制（RBAC）
- ✅ **响应式设计**: 支持多设备访问

---

## 🚀 快速开始

### 前置要求

- Python 3.11+
- Node.js 20+
- MySQL 8.0+
- pnpm 8+ (推荐)

### 本地开发

#### 1. 克隆项目

```bash
git clone https://github.com/your-repo/SchoolSystem.git
cd SchoolSystem
```

#### 2. 后端配置

```bash
cd backend

# 创建虚拟环境
python -m venv myenv

# 激活虚拟环境
# Windows PowerShell
./myenv/Scripts/Activate.ps1
# Linux/Mac
source myenv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置数据库（修改 config/settings.py）
# 创建数据库
mysql -u root -p
CREATE DATABASE byss CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 运行迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 启动开发服务器
python manage.py runserver 127.0.0.1:8000 --noreload
```

#### 3. 前端配置

```bash
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问应用：
- 前端: http://localhost:3000
- 后端 API: http://localhost:8000/api
- Django Admin: http://localhost:8000/admin

---

## 📦 Docker 部署

### 开发环境

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 生产环境

详细部署步骤请参考：[**部署文档**](docs/DEPLOYMENT.md)

#### 快速部署

```bash
# 1. 配置环境变量
cp .env.example .env
vim .env

# 2. 执行部署脚本
chmod +x scripts/*.sh
./scripts/deploy.sh

# 3. 查看服务状态
docker-compose -f docker-compose.prod.yml ps
```

---

## 📖 文档

- [部署文档](docs/DEPLOYMENT.md) - 完整的生产环境部署指南
- [API 文档](http://localhost:8000/api/schema/swagger-ui/) - 自动生成的 API 文档
- [前端开发规范](.cursor/rules/frontendrules.mdc)
- [后端开发规范](.cursor/rules/backendrules.mdc)
- [整体开发规范](.cursor/rules/overallrules.mdc)

---

## 🛠️ 项目结构

```
SchoolSystem/
├── backend/                 # Django 后端
│   ├── apps/               # 应用模块
│   │   ├── students/       # 学生管理
│   │   ├── teachers/       # 教师管理
│   │   ├── courses/        # 课程管理
│   │   ├── schools/        # 学校/班级管理
│   │   ├── grades/         # 年级管理
│   │   └── ...
│   ├── config/             # Django 配置
│   └── requirements.txt    # Python 依赖
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── pages/          # 页面
│   │   ├── services/       # API 服务
│   │   ├── stores/         # 状态管理
│   │   └── types/          # TypeScript 类型
│   └── package.json
├── docker/                 # Docker 配置
│   ├── nginx/              # Nginx 配置
│   ├── mysql/              # MySQL 配置
│   └── redis/              # Redis 配置
├── scripts/                # 部署脚本
│   ├── deploy.sh           # 部署脚本
│   ├── backup.sh           # 备份脚本
│   └── ...
├── docs/                   # 文档
├── docker-compose.yml      # 开发环境
├── docker-compose.prod.yml # 生产环境
└── README.md
```

---

## 🔧 常用命令

### 后端

```bash
# 创建迁移
python manage.py makemigrations

# 执行迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 收集静态文件
python manage.py collectstatic

# 运行开发服务器
python manage.py runserver --noreload
```

### 前端

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 生产构建
pnpm build

# 预览构建
pnpm preview

# 代码检查
pnpm lint
```

### Docker

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 进入容器
docker exec -it byss-backend bash
```

---

## 🧪 测试

### 后端测试

```bash
cd backend

# 运行所有测试
pytest

# 运行特定测试
pytest apps/students/tests.py

# 测试覆盖率
coverage run -m pytest
coverage report
```

### 前端测试

```bash
cd frontend

# 运行单元测试
pnpm test

# 运行 E2E 测试
pnpm test:e2e
```

---

## 🔐 安全

- 使用 JWT 进行身份认证
- 基于角色的访问控制（RBAC）
- SQL 注入防护（使用 ORM）
- XSS 防护（内容转义）
- CSRF 防护（Django CSRF + SameSite Cookie）
- HTTPS 支持（生产环境）

---

## 📊 性能优化

- **前端**:
  - 虚拟化表格处理大量数据
  - 代码分割和懒加载
  - React 组件优化（memo, useMemo, useCallback）
  - 图片优化和压缩

- **后端**:
  - 数据库查询优化（select_related, prefetch_related）
  - Redis 缓存
  - API 响应时间优化
  - 异步任务队列（Celery）

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**:
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

---

## 📝 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新历史。

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 👥 团队

- **项目负责人**: BYSS 技术团队
- **技术支持**: support@example.com

---

## 🙏 致谢

感谢所有贡献者和开源社区的支持！

特别感谢以下开源项目：
- [Django](https://www.djangoproject.com/)
- [React](https://react.dev/)
- [TanStack Virtual](https://tanstack.com/virtual/)
- [Tailwind CSS](https://tailwindcss.com/)

---

<div align="center">

**Made with ❤️ by BYSS Team**

[⬆ 回到顶部](#byss-学校管理系统)

</div>

