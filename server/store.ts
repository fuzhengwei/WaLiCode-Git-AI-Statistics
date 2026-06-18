import fs from 'fs';
import path from 'path';
import { StoredRecord } from './types';

const DATA_FILE = path.join(__dirname, '..', 'data', 'records.json');

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readAll(): StoredRecord[] {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeAll(records: StoredRecord[]) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

export function addRecord(record: StoredRecord): void {
  const records = readAll();
  records.unshift(record);
  writeAll(records);
}

export interface FilterOptions {
  intent?: string;
  author?: string;
  search?: string;
}

export function getRecords(
  limit = 100,
  offset = 0,
  filters?: FilterOptions
): { total: number; records: StoredRecord[] } {
  let all = readAll();

  if (filters?.intent) {
    all = all.filter((r) => r.attribution.intent === filters.intent);
  }
  if (filters?.author) {
    const q = filters.author.toLowerCase();
    all = all.filter((r) => (r.attribution.author?.name || '').toLowerCase().includes(q));
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    all = all.filter((r) => {
      const a = r.attribution;
      return (
        r.commitHash.toLowerCase().includes(q) ||
        (a.promptSummary || '').toLowerCase().includes(q) ||
        (a.intent || '').toLowerCase().includes(q) ||
        (a.files || []).some((f) => f.path.toLowerCase().includes(q))
      );
    });
  }

  return {
    total: all.length,
    records: all.slice(offset, offset + limit),
  };
}

export function deleteRecord(id: string): boolean {
  const records = readAll();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  records.splice(idx, 1);
  writeAll(records);
  return true;
}

export function getStats(): {
  totalCommits: number;
  totalAiLines: number;
  totalHumanLines: number;
  byIntent: Record<string, number>;
  byTool: Record<string, number>;
  byAuthor: Record<string, number>;
  byModel: Record<string, number>;
  recentDaily: { date: string; commits: number; aiLines: number }[];
} {
  const all = readAll();
  const byIntent: Record<string, number> = {};
  const byTool: Record<string, number> = {};
  const byAuthor: Record<string, number> = {};
  const byModel: Record<string, number> = {};
  const dailyMap: Record<string, { commits: number; aiLines: number }> = {};

  let totalAiLines = 0;
  let totalHumanLines = 0;

  for (const r of all) {
    totalAiLines += r.attribution.totalAiLines || 0;
    totalHumanLines += r.attribution.totalHumanLines || 0;

    const intent = r.attribution.intent || 'unknown';
    byIntent[intent] = (byIntent[intent] || 0) + 1;

    const tool = r.attribution.tool || 'unknown';
    byTool[tool] = (byTool[tool] || 0) + 1;

    const author = r.attribution.author?.name || 'unknown';
    byAuthor[author] = (byAuthor[author] || 0) + 1;

    for (const f of r.attribution.files || []) {
      const model = f.model || 'unknown';
      byModel[model] = (byModel[model] || 0) + f.lines.length;
    }

    const day = new Date(r.receivedAt).toISOString().slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { commits: 0, aiLines: 0 };
    dailyMap[day].commits += 1;
    dailyMap[day].aiLines += r.attribution.totalAiLines || 0;
  }

  const recentDaily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, v]) => ({ date, ...v }));

  return {
    totalCommits: all.length,
    totalAiLines,
    totalHumanLines,
    byIntent,
    byTool,
    byAuthor,
    byModel,
    recentDaily,
  };
}

export function clearAll(): void {
  writeAll([]);
}
