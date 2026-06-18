// AI 归因数据类型定义

export interface AiAttributionFile {
  path: string;
  lines: number[];
  model: string;
  generatedAt: number;
}

export interface AiAttributionNote {
  version: number;
  tool: string;
  toolVersion: string;
  author: { name: string; email: string };
  intent: string;
  promptSummary: string;
  files: AiAttributionFile[];
  totalAiLines: number;
  totalHumanLines: number;
  timestamp: number;
}

export interface WebhookPayload {
  event: 'commit' | 'push';
  commitHash: string;
  repoRoot: string;
  attribution: AiAttributionNote;
}

export interface StoredRecord {
  id: string;
  receivedAt: number;
  commitHash: string;
  repoRoot: string;
  event: string;
  attribution: AiAttributionNote;
}
