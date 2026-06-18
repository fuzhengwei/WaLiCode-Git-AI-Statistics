import { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Search,
  FileCode2,
  Terminal,
  Users,
  Code2,
  Activity,
  Cpu,
  Download,
  Trash2,
  X,
} from 'lucide-react';
import {
  fetchRecords,
  deleteRecord,
  deleteAllRecords,
  type StoredRecord,
  fmtDate,
  fmtDateFull,
  shortHash,
  relativeTime,
  intentBadgeClass,
} from '../lib/api';

const PAGE_SIZE = 30;

const INTENT_OPTIONS = ['', 'feature', 'bugfix', 'refactor', 'test', 'docs', 'chore'];

export function RecordsPage() {
  const [records, setRecords] = useState<StoredRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [intentFilter, setIntentFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchRecords(PAGE_SIZE, page * PAGE_SIZE, {
        intent: intentFilter || undefined,
        author: authorFilter || undefined,
        search: debouncedSearch || undefined,
      });
      setRecords(r.records);
      setTotal(r.total);
    } finally {
      setLoading(false);
    }
  }, [page, intentFilter, authorFilter, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [intentFilter, authorFilter, debouncedSearch]);

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条记录？')) return;
    await deleteRecord(id);
    load();
  };

  const handleClearAll = async () => {
    if (!confirm('确定删除所有记录？此操作不可恢复。')) return;
    await deleteAllRecords();
    load();
  };

  const handleExport = () => {
    // Export all records as JSON
    fetch('/api/records?limit=10000&offset=0')
      .then((r) => r.json())
      .then((data) => {
        const blob = new Blob([JSON.stringify(data.records, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-attribution-records-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  const hasFilters = search || intentFilter || authorFilter;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-zinc-200 bg-white px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-zinc-900">归因记录</h1>
          <span className="text-xs text-zinc-400 tabular-nums">{total} 条</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            导出
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-red-200 hover:bg-red-50 text-red-600 font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空
          </button>
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-zinc-200 px-6 py-3 flex items-center gap-3 flex-shrink-0">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索摘要、commit、文件..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 placeholder:text-zinc-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Intent filter */}
        <select
          value={intentFilter}
          onChange={(e) => setIntentFilter(e.target.value)}
          className="text-sm border border-zinc-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white"
        >
          {INTENT_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v || '全部意图'}
            </option>
          ))}
        </select>

        {/* Author filter */}
        <input
          type="text"
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
          placeholder="作者"
          className="text-sm border border-zinc-200 rounded-md px-2.5 py-1.5 w-28 focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
        />

        {hasFilters && (
          <button
            onClick={() => {
              setSearch('');
              setIntentFilter('');
              setAuthorFilter('');
            }}
            className="text-xs text-zinc-500 hover:text-zinc-700 px-2 py-1"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {/* Table header */}
        <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-3 sticky top-0 z-10">
          <div className="w-4"></div>
          <div className="w-16">Commit</div>
          <div className="w-20">意图</div>
          <div className="flex-1">摘要</div>
          <div className="w-28 text-right">时间</div>
          <div className="w-24 text-right">AI 占比</div>
          <div className="w-8"></div>
        </div>

        {/* Records */}
        {records.length === 0 ? (
          <div className="py-20 text-center text-zinc-400 text-sm">
            {hasFilters ? '没有匹配的记录' : '暂无归因记录，等待 Webhook 上报...'}
          </div>
        ) : (
          records.map((r) => {
            const expanded = expandedId === r.id;
            const a = r.attribution;
            const total = a.totalAiLines + a.totalHumanLines;
            const ratio = total > 0 ? Math.round((a.totalAiLines / total) * 100) : 0;

            return (
              <div key={r.id} className="border-b border-zinc-100 last:border-0">
                <div
                  className="px-6 py-2.5 flex items-center gap-3 hover:bg-zinc-50/50 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expanded ? null : r.id)}
                >
                  <div className="text-zinc-400 w-4">
                    {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                  <div className="font-mono text-xs text-zinc-600 w-16">{shortHash(r.commitHash)}</div>
                  <div className="w-20">
                    <span className={`text-[11px] px-1.5 py-0.5 rounded border font-medium ${intentBadgeClass(a.intent)}`}>
                      {a.intent || 'unknown'}
                    </span>
                  </div>
                  <div className="flex-1 text-sm text-zinc-700 truncate">{a.promptSummary || '—'}</div>
                  <div className="text-xs text-zinc-400 w-28 text-right tabular-nums" title={fmtDateFull(r.receivedAt)}>
                    {relativeTime(r.receivedAt)}
                  </div>
                  <div className="w-24 flex items-center justify-end gap-1.5">
                    <div className="flex-1 bg-zinc-100 rounded-full h-1 max-w-[60px]">
                      <div className="bg-zinc-800 h-full rounded-full transition-all" style={{ width: `${ratio}%` }} />
                    </div>
                    <span className="text-xs text-zinc-500 tabular-nums w-8 text-right">{ratio}%</span>
                  </div>
                  <div className="w-8 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(r.id);
                      }}
                      className="text-zinc-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="px-10 pb-4 pt-1 bg-zinc-50/30 border-t border-zinc-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 pb-3">
                      <div>
                        <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">工具</div>
                        <div className="text-sm text-zinc-700 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                          {a.tool} <span className="text-zinc-400 text-xs">v{a.toolVersion}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">作者</div>
                        <div className="text-sm text-zinc-700 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-zinc-400" />
                          {a.author?.name || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">AI 行数</div>
                        <div className="text-sm text-zinc-700 flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="font-semibold tabular-nums">{a.totalAiLines}</span>
                          <span className="text-zinc-400">/ {a.totalHumanLines}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">占比</div>
                        <div className="text-sm text-zinc-700 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="font-medium tabular-nums">{ratio}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Prompt 摘要</div>
                      <div className="text-sm text-zinc-600 bg-white border border-zinc-200 rounded-md p-3">
                        {a.promptSummary || '—'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                        涉及文件 ({a.files?.length || 0})
                      </div>
                      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
                        {(a.files || []).map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 text-sm px-3 py-2 border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                          >
                            <FileCode2 className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                            <span className="font-mono text-xs text-zinc-600 truncate flex-1">{f.path}</span>
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium tabular-nums">
                              {f.lines.length} 行
                            </span>
                            <span className="text-xs text-zinc-400 flex items-center gap-1 w-28 justify-end">
                              <Cpu className="w-3 h-3" />
                              {f.model || 'Unknown'}
                            </span>
                          </div>
                        ))}
                        {(!a.files || a.files.length === 0) && (
                          <div className="px-3 py-2.5 text-sm text-zinc-400 text-center">无文件记录</div>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-400 flex items-center gap-4 mt-3 pt-3 border-t border-zinc-100">
                      <span>Commit: <span className="font-mono">{r.commitHash}</span></span>
                      <span>Repo: {r.repoRoot}</span>
                      <span>接收时间: {fmtDateFull(r.receivedAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="border-t border-zinc-200 bg-white px-6 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-zinc-400">
            第 {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, total)} 条，共 {total} 条
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded-md text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              上一页
            </button>
            <div className="text-xs text-zinc-400 px-2 tabular-nums">
              {page + 1} / {Math.ceil(total / PAGE_SIZE)}
            </div>
            <button
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-md text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
