# ===== Stage 1: Build =====
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json ./
RUN npm ci

# 复制源码
COPY . .

# 构建
RUN npm run build

# ===== Stage 2: Runtime =====
FROM node:20-alpine AS runtime

WORKDIR /app

# 只复制运行所需文件
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "dist/server/index.js"]
