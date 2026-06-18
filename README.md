# AI Attribution Dashboard

WaLiCode AI 归因数据接收与可视化展示服务。

## 快速开始

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

## 架构

- **前端**：React 18 + Vite + Tailwind CSS + Recharts
- **后端**：Express + TypeScript（JSON 文件存储）
- **端口**：前端 5173 / 后端 3000

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

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/records` | 获取记录列表（支持 limit/offset/intent/author/search 参数） |
| GET | `/api/stats` | 获取统计汇总 |
| DELETE | `/api/records` | 清空所有记录 |
| DELETE | `/api/records/:id` | 删除单条记录 |

## 文件结构

```
├── client/
│   ├── App.tsx              # 主应用 + 路由
│   ├── main.tsx             # 入口
│   ├── index.html
│   ├── index.css
│   ├── lib/
│   │   └── api.ts           # 类型定义 + API 封装 + 工具函数
│   └── pages/
│       ├── OverviewPage.tsx  # 数据总览
│       ├── RecordsPage.tsx   # 归因记录
│       ├── StatsPage.tsx     # 统计分析
│       └── SettingsPage.tsx  # 设置
├── server/
│   ├── index.ts             # Express 服务
│   ├── store.ts             # JSON 文件存储 + 查询/筛选
│   └── types.ts             # 类型定义
├── data/
│   └── records.json         # 数据文件
├── tailwind.config.js
├── vite.config.ts
└── package.json
```
