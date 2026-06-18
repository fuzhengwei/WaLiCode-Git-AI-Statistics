import { RefreshCw, BarChart3, Layers, Users, Cpu, Wrench } from 'lucide-react';
import { type Stats } from '../lib/api';

interface Props {
  stats: Stats | null;
  loading: boolean;
  onRefresh: () => void;
}

function BarRow({ name, value, max, color }: { name: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-24 text-xs text-zinc-600 truncate text-right shrink-0" title={name}>
        {name}
      </div>
      <div className="flex-1 h-5 flex items-center">
        <div className={`h-4 rounded-sm ${color}`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <div className="w-12 text-xs text-zinc-500 text-right tabular-nums">{value}</div>
    </div>
  );
}

function StatBlock({ title, icon: Icon, data, color }: { title: string; icon: any; data: { name: string; value: number }[]; color: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-zinc-400" />
        {title}
      </h3>
      {data.length === 0 ? (
        <div className="text-zinc-400 text-sm py-6 text-center">暂无数据</div>
      ) : (
        <div>
          {data.map((d, i) => (
            <BarRow key={i} name={d.name} value={d.value} max={data[0].value} color={color} />
          ))}
        </div>
      )}
    </div>
  );
}

export function StatsPage({ stats, loading, onRefresh }: Props) {
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

  const intentData = Object.entries(stats.byIntent)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const authorData = Object.entries(stats.byAuthor)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const modelData = Object.entries(stats.byModel)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const toolData = Object.entries(stats.byTool)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const totalLines = stats.totalAiLines + stats.totalHumanLines;
  const aiRatio = totalLines > 0 ? ((stats.totalAiLines / totalLines) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="h-14 border-b border-zinc-200 bg-white px-6 flex items-center justify-between flex-shrink-0">
        <h1 className="text-base font-semibold text-zinc-900">统计分析</h1>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Summary strip */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white border border-zinc-200 rounded-lg p-4">
              <div className="text-xs text-zinc-500 mb-1">总提交</div>
              <div className="text-xl font-semibold text-zinc-900 tabular-nums">{stats.totalCommits}</div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-4">
              <div className="text-xs text-zinc-500 mb-1">AI 代码行</div>
              <div className="text-xl font-semibold text-zinc-900 tabular-nums">{stats.totalAiLines.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-4">
              <div className="text-xs text-zinc-500 mb-1">人工代码行</div>
              <div className="text-xl font-semibold text-zinc-900 tabular-nums">{stats.totalHumanLines.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-4">
              <div className="text-xs text-zinc-500 mb-1">AI 占比</div>
              <div className="text-xl font-semibold text-zinc-900 tabular-nums">{aiRatio}%</div>
            </div>
          </div>

          {/* Distribution charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatBlock title="提交意图分布" icon={Layers} data={intentData} color="bg-zinc-800" />
            <StatBlock title="作者贡献" icon={Users} data={authorData} color="bg-zinc-700" />
            <StatBlock title="模型使用占比" icon={Cpu} data={modelData} color="bg-zinc-600" />
            <StatBlock title="工具分布" icon={Wrench} data={toolData} color="bg-zinc-500" />
          </div>

          {/* Daily breakdown */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-zinc-400" />
              每日提交明细
            </h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                    <th className="text-left py-2 px-2">日期</th>
                    <th className="text-right py-2 px-2">提交数</th>
                    <th className="text-right py-2 px-2">AI 行数</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats.recentDaily].reverse().map((d) => (
                    <tr key={d.date} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                      <td className="py-2 px-2 text-zinc-600 tabular-nums">{d.date}</td>
                      <td className="py-2 px-2 text-right text-zinc-700 tabular-nums">{d.commits}</td>
                      <td className="py-2 px-2 text-right text-zinc-700 tabular-nums">{d.aiLines.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
