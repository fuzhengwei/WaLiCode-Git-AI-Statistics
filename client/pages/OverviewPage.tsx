import { GitCommit, Code2, Users, Activity, RefreshCw } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { type Stats, fmtDate, shortHash, intentBadgeClass, fetchRecords, type StoredRecord } from '../lib/api';
import { useState, useEffect } from 'react';

interface Props {
  stats: Stats | null;
  loading: boolean;
  onRefresh: () => void;
}

function MetricCard({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: any }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-500">{label}</span>
        <Icon className="w-4 h-4 text-zinc-400" />
      </div>
      <div className="text-2xl font-semibold text-zinc-900 tabular-nums">{value}</div>
      {sub && <div className="text-xs text-zinc-400 mt-1">{sub}</div>}
    </div>
  );
}

export function OverviewPage({ stats, loading, onRefresh }: Props) {
  const [recentRecords, setRecentRecords] = useState<StoredRecord[]>([]);

  useEffect(() => {
    fetchRecords(5, 0).then((r) => setRecentRecords(r.records));
  }, [stats?.totalCommits]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!stats) {
    return <div className="flex items-center justify-center h-screen text-zinc-400 text-sm">无法加载数据</div>;
  }

  const totalLines = stats.totalAiLines + stats.totalHumanLines;
  const aiRatio = totalLines > 0 ? ((stats.totalAiLines / totalLines) * 100).toFixed(1) : '0.0';

  const chartData = stats.recentDaily.map((d) => ({
    ...d,
    date: d.date.slice(5),
  }));

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-zinc-200 bg-white px-6 flex items-center justify-between flex-shrink-0">
        <h1 className="text-base font-semibold text-zinc-900">数据总览</h1>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="总提交数" value={stats.totalCommits.toLocaleString()} icon={GitCommit} />
            <MetricCard label="AI 生成行" value={stats.totalAiLines.toLocaleString()} sub={`占比 ${aiRatio}%`} icon={Code2} />
            <MetricCard label="人工编写行" value={stats.totalHumanLines.toLocaleString()} icon={Users} />
            <MetricCard label="AI 渗透率" value={`${aiRatio}%`} sub={stats.totalCommits > 0 ? `${stats.totalCommits} 次提交` : ''} icon={Activity} />
          </div>

          {/* Trend Chart */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">每日 AI 代码生成趋势</h3>
            <div className="h-60">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#18181b" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#18181b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '6px',
                        border: '1px solid #e4e4e7',
                        boxShadow: '0 1px 3px rgb(0 0 0 / 0.08)',
                        fontSize: '12px',
                      }}
                      cursor={{ stroke: '#d4d4d8', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="aiLines"
                      name="AI 代码行"
                      stroke="#18181b"
                      strokeWidth={1.5}
                      fill="url(#aiGradient)"
                      activeDot={{ r: 4, strokeWidth: 0, fill: '#18181b' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-400 text-sm">暂无趋势数据</div>
              )}
            </div>
          </div>

          {/* Recent Records */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">最近提交</h3>
              <span className="text-xs text-zinc-400">{stats.totalCommits} 条记录</span>
            </div>
            <div>
              {recentRecords.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-sm">暂无归因记录</div>
              ) : (
                recentRecords.map((r) => {
                  const a = r.attribution;
                  const total = a.totalAiLines + a.totalHumanLines;
                  const ratio = total > 0 ? Math.round((a.totalAiLines / total) * 100) : 0;
                  return (
                    <div key={r.id} className="px-5 py-3 border-b border-zinc-100 last:border-0 flex items-center gap-3 hover:bg-zinc-50/50 transition-colors">
                      <span className="font-mono text-xs text-zinc-500 w-16">{shortHash(r.commitHash)}</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded border font-medium ${intentBadgeClass(a.intent)}`}>
                        {a.intent || 'unknown'}
                      </span>
                      <span className="flex-1 text-sm text-zinc-700 truncate">{a.promptSummary || '—'}</span>
                      <span className="text-xs text-zinc-400 w-24 text-right tabular-nums">{fmtDate(r.receivedAt)}</span>
                      <div className="w-16 flex items-center gap-1.5">
                        <div className="flex-1 bg-zinc-100 rounded-full h-1">
                          <div className="bg-zinc-800 h-full rounded-full" style={{ width: `${ratio}%` }} />
                        </div>
                        <span className="text-xs text-zinc-500 tabular-nums w-8 text-right">{ratio}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
