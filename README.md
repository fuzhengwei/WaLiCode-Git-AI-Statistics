# AI Attribution Dashboard

> WaLiCode Git AI 代码归因统计面板 —— 接收、存储与可视化展示 AI 生成代码的归因数据。

## 项目简介

AI Attribution Dashboard 是一个轻量级的 AI 代码归因数据接收与可视化服务。通过 Webhook 接收 Git 提交中的 AI 归因数据，提供统计分析和可视化展示，帮助团队了解 AI 代码在项目中的贡献比例。

## 快速开始

### 方式一：Docker 部署（推荐）

#### 环境要求

- Docker >= 20

#### 一键部署

```bash
# 下载部署脚本
curl -fsSL https://raw.githubusercontent.com/fuzhengwei/WaLiCode-Git-AI-Statistics/main/deploy.sh -o deploy.sh
chmod +x deploy.sh

# 默认 3000 端口部署
./deploy.sh

# 或指定端口
./deploy.sh 8080
```

#### 手动部署

```bash
# 拉取镜像
docker pull registry.cn-hangzhou.aliyuncs.com/fuzhengwei/walicode-git-ai-statistics:1.0.0

# 启动容器
docker run -d \
  --name ai-attribution-dashboard \
  -p 3000:3000 \
  -v ai-attribution-dashboard-data:/app/data \
  --restart unless-stopped \
  registry.cn-hangzhou.aliyuncs.com/fuzhengwei/walicode-git-ai-statistics:1.0.0
```

#### Docker 管理命令

```bash
# 查看日志
docker logs -f ai-attribution-dashboard

# 停止服务
docker stop ai-attribution-dashboard

# 启动服务
docker start ai-attribution-dashboard

# 卸载（含数据）
docker rm -f ai-attribution-dashboard && docker volume rm ai-attribution-dashboard-data
```

### 方式二：源码运行

#### 环境要求

- Node.js >= 18
- npm >= 9

```bash
# 安装依赖
npm install

# 开发模式（同时启动前后端）
npm run dev

# 生产构建
npm run build

# 生产运行
npm run start
```

### 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 API | 3000 | Express 服务，提供 Webhook、API 和静态文件 |
| 前端 Dev | 5173 | Vite 开发服务器（仅开发模式） |

生产模式下，前端构建产物由后端 3000 端口统一提供，只需访问 `http://localhost:3000`。

## 架构

- **前端**：React 18 + Vite + Tailwind CSS + Recharts
- **后端**：Express + TypeScript（JSON 文件存储，无需数据库）
- **存储**：本地 JSON 文件（`data/records.json`）

## 功能

### 数据总览
- 核心指标卡片（提交数、AI/人工代码行、AI 渗透率）
- 每日 AI 代码生成趋势图
- 最近提交列表

### 归因记录
- 完整记录列表，支持搜索（摘要/commit/文件路径）
- 按意图、作者筛选
- 展开查看详情（工具、作者、文件列表、Prompt 摘要）
- 单条删除 / 批量清空 / JSON 导出
- 分页浏览

### 统计分析
- 意图分布 / 作者贡献 / 模型使用 / 工具分布
- 每日提交明细表格

### 设置
- Webhook 端点配置与示例
- 服务信息
- 数据管理（导出 / 清空）

## 部署后使用指南

### 1. 访问后台面板

部署成功后，浏览器打开：

```
http://<服务器IP>:3000
```

如果是本机部署，直接访问 `http://localhost:3000`

面板包含四个页面：
- **数据总览** — 核心指标卡片、趋势图、最近提交
- **归因记录** — 完整记录列表，支持搜索/筛选/删除/导出
- **统计分析** — 意图分布、作者贡献、模型使用、工具分布
- **设置** — Webhook 配置信息、服务状态、数据管理

### 2. 配置 Webhook

在「设置」页面可以看到 Webhook 端点地址：

```
http://<服务器IP>:3000/webhook/ai-attribution
```

#### 在 WaLiCode 中配置

将上述地址填入 WaLiCode 的归因上报配置中，WaLiCode 会在每次 Git 提交时自动推送归因数据。

#### 手动测试 Webhook

```bash
curl -X POST http://localhost:3000/webhook/ai-attribution \
  -H "Content-Type: application/json" \
  -d '{"event":"test","test":true}'
```

返回 `{"success":true}` 表示连接正常。

### 3. Webhook 数据格式

```
POST /webhook/ai-attribution
Content-Type: application/json

{
  "event": "commit",
  "commitHash": "abc123...",
  "repoRoot": "/path/to/repo",
  "attribution": {
    "version": 2,
    "tool": "WaLiCode",
    "toolVersion": "0.5.6",
    "author": { "name": "user", "email": "" },
    "intent": "feature",
    "promptSummary": "...",
    "files": [{ "path": "src/main.ts", "lines": [10,11,12], "model": "claude-opus-4-6", "generatedAt": 1781653276978 }],
    "totalAiLines": 6,
    "totalHumanLines": 9,
    "timestamp": 1781653313091
  }
}
```

WaLiCode 提交代码时自动触发，无需手动调用。

## API 列表

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/records` | 获取记录列表（支持 limit/offset/intent/author/search 参数） |
| GET | `/api/stats` | 获取统计汇总 |
| DELETE | `/api/records` | 清空所有记录 |
| DELETE | `/api/records/:id` | 删除单条记录 |

## 文件结构

```
├── client/                     # 前端源码
│   ├── App.tsx                 # 主应用 + 路由
│   ├── main.tsx                # 入口
│   ├── index.html
│   ├── index.css
│   ├── lib/
│   │   └── api.ts              # 类型定义 + API 封装 + 工具函数
│   └── pages/
│       ├── OverviewPage.tsx    # 数据总览
│       ├── RecordsPage.tsx     # 归因记录
│       ├── StatsPage.tsx       # 统计分析
│       └── SettingsPage.tsx    # 设置
├── server/                     # 后端源码
│   ├── index.ts                # Express 服务
│   ├── store.ts                # JSON 文件存储 + 查询/筛选
│   ├── tsconfig.json           # 服务端 TS 编译配置
│   └── types.ts                # 类型定义
├── data/                       # 运行时数据（gitignore）
│   └── records.json            # 数据文件
├── dist/                       # 构建产物（gitignore）
├── Dockerfile                  # Docker 多阶段构建
├── deploy.sh                   # 一键部署脚本
├── .github/workflows/
│   └── docker-push.yml         # GitHub Actions CI/CD
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 18 |
| 构建工具 | Vite 5 |
| 样式 | Tailwind CSS |
| 图表 | Recharts |
| 后端 | Express 4 |
| 语言 | TypeScript |
| 存储 | JSON 文件 |

## Docker 镜像

| 镜像 | 说明 |
|------|------|
| `registry.cn-hangzhou.aliyuncs.com/fuzhengwei/walicode-git-ai-statistics:1.0.0` | 指定版本 |
| `registry.cn-hangzhou.aliyuncs.com/fuzhengwei/walicode-git-ai-statistics:latest` | 最新版本 |

CI/CD 通过 GitHub Actions 自动构建，push 到 `main` 分支即触发。

## License

MIT
