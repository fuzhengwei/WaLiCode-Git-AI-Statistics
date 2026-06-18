#!/bin/bash
# deploy.sh - AI Attribution Dashboard 一键部署脚本
# 用法: ./deploy.sh [端口号，默认3000]

set -e

PORT=${1:-3000}
IMAGE="registry.cn-hangzhou.aliyuncs.com/fuzhengwei/walicode-git-ai-statistics:1.0.0"
CONTAINER_NAME="ai-attribution-dashboard"

echo "🚀 开始部署 AI Attribution Dashboard..."
echo "   镜像: $IMAGE"
echo "   端口: $PORT"
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker 未安装，请先安装 Docker"
  exit 1
fi

# 拉取镜像
echo "📦 拉取镜像..."
docker pull "$IMAGE"

# 停止旧容器（如果存在）
echo "🧹 清理旧容器..."
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

# 启动容器
echo "▶️  启动容器..."
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "${PORT}:3000" \
  -v "${CONTAINER_NAME}-data:/app/data" \
  --restart unless-stopped \
  "$IMAGE"

echo ""
echo "✅ 部署完成！"
echo ""
echo "📊 访问地址: http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost'):${PORT}"
echo "📊 本机访问: http://localhost:${PORT}"
echo ""
echo "🔍 查看日志: docker logs -f $CONTAINER_NAME"
echo "⏹️  停止服务: docker stop $CONTAINER_NAME"
echo "▶️  启动服务: docker start $CONTAINER_NAME"
echo "🗑️  卸载服务: docker rm -f $CONTAINER_NAME && docker volume rm ${CONTAINER_NAME}-data"
