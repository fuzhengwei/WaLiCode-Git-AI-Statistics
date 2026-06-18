import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  GitCommit,
  BarChart3,
  Settings,
  Box,
} from 'lucide-react';
import { OverviewPage } from './pages/OverviewPage';
import { RecordsPage } from './pages/RecordsPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { fetchStats, type Stats } from './lib/api';

type PageId = 'overview' | 'records' | 'stats' | 'settings';

const NAV_ITEMS: { id: PageId; label: string; icon: any }[] = [
  { id: 'overview', label: '总览', icon: LayoutDashboard },
  { id: 'records', label: '归因记录', icon: GitCommit },
  { id: 'stats', label: '统计分析', icon: BarChart3 },
  { id: 'settings', label: '设置', icon: Settings },
];

export default function App() {
  const [page, setPage] = useState<PageId>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = async (silent = false) => {
    if (!silent) setStatsLoading(true);
    try {
      const s = await fetchStats();
      setStats(s);
    } catch {
      // ignore
    } finally {
      if (!silent) setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const timer = setInterval(() => loadStats(true), 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-zinc-200 flex-shrink-0 flex flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-zinc-200">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-zinc-900 flex items-center justify-center">
              <Box className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-zinc-900">AI Attribution</div>
              <div className="text-[11px] text-zinc-400">WaLiCode</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <item.icon className="w-4 h-4" strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Stats summary at bottom */}
        {stats && (
          <div className="p-3 border-t border-zinc-200">
            <div className="px-3 py-2 rounded-md bg-zinc-50 text-xs space-y-1">
              <div className="flex justify-between text-zinc-500">
                <span>提交数</span>
                <span className="font-semibold text-zinc-900 tabular-nums">{stats.totalCommits}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>AI 行数</span>
                <span className="font-semibold text-zinc-900 tabular-nums">{stats.totalAiLines.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {page === 'overview' && <OverviewPage stats={stats} loading={statsLoading} onRefresh={() => loadStats()} />}
        {page === 'records' && <RecordsPage />}
        {page === 'stats' && <StatsPage stats={stats} loading={statsLoading} onRefresh={() => loadStats()} />}
        {page === 'settings' && <SettingsPage onStatsRefresh={() => loadStats()} />}
      </div>
    </div>
  );
}
