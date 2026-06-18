# AI Attribution Dashboard

> WaLiCode Git AI 代码归因统计面板 —— 接收、存储与可视化展示 AI 生成代码的归因数据。

## 项目简介

AI Attribution Dashboard 是一个轻量级的 AI 代码归因数据接收与可视化服务。通过 Webhook 接收 Git 提交中的 AI 归因数据，提供统计分析和可视化展示，帮助团队了解 AI 代码在项目中的贡献比例。

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与运行

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

## Webhook 接口

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

### 测试连接

```bash
curl -X POST http://localhost:3000/webhook/ai-attribution \
  -H "Content-Type: application/json" \
  -d '{"event":"test","test":true}'
```

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

## License

MIT
