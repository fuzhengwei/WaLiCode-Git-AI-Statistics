import { useState } from 'react';
import { Settings, Webhook, Database, Copy, Check, Server } from 'lucide-react';

interface Props {
  onStatsRefresh: () => void;
}

export function SettingsPage({ onStatsRefresh }: Props) {
  const [copied, setCopied] = useState(false);
  const webhookUrl = `${window.location.origin}/webhook/ai-attribution`;

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="h-14 border-b border-zinc-200 bg-white px-6 flex items-center flex-shrink-0">
        <h1 className="text-base font-semibold text-zinc-900">设置</h1>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Webhook config */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <Webhook className="w-4 h-4 text-zinc-400" />
              Webhook 配置
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">接收端点</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 font-mono text-zinc-700">
                    {webhookUrl}
                  </code>
                  <button
                    onClick={copyUrl}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">请求方法</label>
                <code className="text-sm bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 font-mono text-zinc-700 block">
                  POST
                </code>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Content-Type</label>
                <code className="text-sm bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 font-mono text-zinc-700 block">
                  application/json
                </code>
              </div>
              <div className="pt-2">
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Payload 示例</label>
                <pre className="text-xs bg-zinc-900 text-zinc-100 rounded-md p-4 overflow-auto font-mono leading-relaxed">
{`{
  "event": "commit",
  "commitHash": "1a991050...",
  "repoRoot": "/path/to/repo",
  "attribution": {
    "version": 2,
    "tool": "WaLiCode",
    "toolVersion": "0.5.6",
    "author": { "name": "user", "email": "" },
    "intent": "feature",
    "promptSummary": "实现XX功能",
    "files": [{ "path": "src/main.ts", "lines": [10,11,12], "model": "claude-opus-4-6", "generatedAt": 1781653276978 }],
    "totalAiLines": 6,
    "totalHumanLines": 9,
    "timestamp": 1781653313091
  }
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Server info */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-zinc-400" />
              服务信息
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500">运行端口</span>
                <span className="text-zinc-700 font-mono">{window.location.port || '80'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500">API 端点</span>
                <span className="text-zinc-700 font-mono">/api/records, /api/stats</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-500">数据存储</span>
                <span className="text-zinc-700 font-mono">JSON 文件</span>
              </div>
            </div>
          </div>

          {/* Data management */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-zinc-400" />
              数据管理
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-zinc-700">导出全部记录</div>
                  <div className="text-xs text-zinc-400">下载 JSON 格式的完整数据</div>
                </div>
                <button
                  onClick={() => {
                    fetch('/api/records?limit=10000&offset=0')
                      .then((r) => r.json())
                      .then((data) => {
                        const blob = new Blob([JSON.stringify(data.records, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `ai-attribution-${new Date().toISOString().slice(0, 10)}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      });
                  }}
                  className="text-xs px-3 py-1.5 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium transition-colors"
                >
                  导出
                </button>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-zinc-100">
                <div>
                  <div className="text-sm text-red-600">清空所有记录</div>
                  <div className="text-xs text-zinc-400">删除全部归因数据，不可恢复</div>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm('确定删除所有记录？此操作不可恢复。')) return;
                    await fetch('/api/records', { method: 'DELETE' });
                    onStatsRefresh();
                  }}
                  className="text-xs px-3 py-1.5 rounded-md border border-red-200 hover:bg-red-50 text-red-600 font-medium transition-colors"
                >
                  清空
                </button>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="text-center text-xs text-zinc-400 py-4">
            AI Attribution Dashboard · Powered by WaLiCode
          </div>
        </div>
      </div>
    </div>
  );
}
