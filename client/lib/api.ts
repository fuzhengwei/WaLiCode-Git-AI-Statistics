// Shared types & API helpers

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

export interface StoredRecord {
  id: string;
  receivedAt: number;
  commitHash: string;
  repoRoot: string;
  event: string;
  attribution: AiAttributionNote;
}

export interface Stats {
  totalCommits: number;
  totalAiLines: number;
  totalHumanLines: number;
  byIntent: Record<string, number>;
  byTool: Record<string, number>;
  byAuthor: Record<string, number>;
  byModel: Record<string, number>;
  recentDaily: { date: string; commits: number; aiLines: number }[];
}

const API_BASE = '/api';

export async function fetchRecords(
  limit = 50,
  offset = 0,
  filters?: { intent?: string; author?: string; search?: string }
): Promise<{ total: number; records: StoredRecord[] }> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  if (filters?.intent) params.set('intent', filters.intent);
  if (filters?.author) params.set('author', filters.author);
  if (filters?.search) params.set('search', filters.search);
  const r = await fetch(`${API_BASE}/records?${params}`);
  return r.json();
}

export async function fetchStats(): Promise<Stats> {
  const r = await fetch(`${API_BASE}/stats`);
  return r.json();
}

export async function deleteAllRecords(): Promise<void> {
  await fetch(`${API_BASE}/records`, { method: 'DELETE' });
}

export async function deleteRecord(id: string): Promise<void> {
  await fetch(`${API_BASE}/records/${id}`, { method: 'DELETE' });
}

// ===== Helpers =====
export function fmtDate(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtDateFull(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function shortHash(h: string) {
  return h.slice(0, 7);
}

export function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}

const INTENT_COLORS: Record<string, string> = {
  feature: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  bugfix: 'text-red-700 bg-red-50 border-red-200',
  refactor: 'text-blue-700 bg-blue-50 border-blue-200',
  test: 'text-amber-700 bg-amber-50 border-amber-200',
  docs: 'text-cyan-700 bg-cyan-50 border-cyan-200',
  chore: 'text-zinc-700 bg-zinc-50 border-zinc-200',
};

export function intentBadgeClass(intent: string) {
  return INTENT_COLORS[intent] || 'text-violet-700 bg-violet-50 border-violet-200';
}
