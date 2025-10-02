# BYSS School Management System - Frontend Dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json pnpm-lock.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建生产版本
RUN pnpm build

# Stage 2: Production
FROM nginx:alpine

# 复制构建产物到 nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置（后续会创建）
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]

