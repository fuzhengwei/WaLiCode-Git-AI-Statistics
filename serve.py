#!/usr/bin/env python3
"""Lightweight dev server for ai-attribution-dashboard (no Node needed)."""
import json, os, http.server, socketserver, urllib.parse
from pathlib import Path

ROOT = Path(__file__).parent
DATA = ROOT / 'data' / 'records.json'

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/' or path == '/index.html':
            self._serve_index()
            return
        if path.startswith('/api/stats'):
            self._serve_stats()
            return
        if path.startswith('/api/records'):
            self._serve_records(parsed.query)
            return
        # Static files
        super().do_GET()

    def do_POST(self):
        if self.path == '/webhook/ai-attribution':
            body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
            payload = json.loads(body)
            if payload.get('event') == 'test' or payload.get('test'):
                self._json({'ok': True, 'message': 'Connection test passed'})
                return
            record = {
                'id': f'{int(__import__("time").time()*1000)}-{os.urandom(4).hex()}',
                'receivedAt': int(__import__("time").time()*1000),
                'commitHash': payload.get('commitHash', ''),
                'repoRoot': payload.get('repoRoot', ''),
                'event': payload.get('event', 'commit'),
                'attribution': payload.get('attribution', {}),
            }
            records = self._read_records()
            records.insert(0, record)
            self._write_records(records)
            print(f"[webhook] {record['commitHash'][:7]} — {record['attribution'].get('intent','?')} — {record['attribution'].get('totalAiLines',0)} AI lines")
            self._json({'ok': True, 'id': record['id']})
            return
        self.send_error(404)

    def do_DELETE(self):
        if self.path == '/api/records':
            self._write_records([])
            self._json({'ok': True})
            return
        if self.path.startswith('/api/records/'):
            rid = self.path.split('/')[-1]
            records = self._read_records()
            records = [r for r in records if r['id'] != rid]
            self._write_records(records)
            self._json({'ok': True})
            return
        self.send_error(404)

    def _serve_index(self):
        # Build a simple HTML that loads React from CDN + our app inline
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        html = '''<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Attribution</title>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://unpkg.com/recharts@2/umd/Recharts.min.js"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<script type="module">
import 'https://esm.sh/lucide-react@1.20.0';
</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.5;background:#fafafa;color:#18181b}
</style>
</head><body><div id="root">Loading... (dev mode - use vite for full experience)</div>
<script>
// In dev mode without vite, we serve a simple status page
document.getElementById('root').innerHTML = \`
<div style="max-width:600px;margin:80px auto;padding:40px;background:white;border:1px solid #e4e4e7;border-radius:8px">
<h2 style="font-size:18px;font-weight:600;margin-bottom:12px">AI Attribution Dashboard</h2>
<p style="color:#71717a;margin-bottom:16px">Dev server running. API endpoints:</p>
<ul style="color:#71717a;line-height:2;font-family:monospace;font-size:13px">
<li>GET /api/stats</li>
<li>GET /api/records</li>
<li>POST /webhook/ai-attribution</li>
<li>DELETE /api/records/:id</li>
</ul>
<p style="color:#a1a1aa;margin-top:16px;font-size:12px">Note: Full UI requires Vite. Run <code>npx vite</code> separately for frontend.</p>
</div>\`;
</script>
</body></html>'''
        self.wfile.write(html.encode())

    def _serve_stats(self):
        records = self._read_records()
        stats = {
            'totalCommits': len(records),
            'totalAiLines': sum(r.get('attribution',{}).get('totalAiLines',0) for r in records),
            'totalHumanLines': sum(r.get('attribution',{}).get('totalHumanLines',0) for r in records),
            'byIntent': {}, 'byTool': {}, 'byAuthor': {}, 'byModel': {},
            'recentDaily': []
        }
        daily = {}
        for r in records:
            a = r.get('attribution', {})
            intent = a.get('intent', 'unknown')
            stats['byIntent'][intent] = stats['byIntent'].get(intent, 0) + 1
            tool = a.get('tool', 'unknown')
            stats['byTool'][tool] = stats['byTool'].get(tool, 0) + 1
            author = a.get('author', {}).get('name', 'unknown')
            stats['byAuthor'][author] = stats['byAuthor'].get(author, 0) + 1
            for f in a.get('files', []):
                model = f.get('model', 'unknown')
                stats['byModel'][model] = stats['byModel'].get(model, 0) + len(f.get('lines', []))
            day = __import__('datetime').datetime.fromtimestamp(r.get('receivedAt',0)/1000).strftime('%Y-%m-%d')
            if day not in daily: daily[day] = {'commits': 0, 'aiLines': 0}
            daily[day]['commits'] += 1
            daily[day]['aiLines'] += a.get('totalAiLines', 0)
        stats['recentDaily'] = [{'date': k, **v} for k, v in sorted(daily.items())[-30:]]
        self._json(stats)

    def _serve_records(self, query):
        qs = urllib.parse.parse_qs(query)
        limit = int(qs.get('limit', ['50'])[0])
        offset = int(qs.get('offset', ['0'])[0])
        records = self._read_records()
        # Apply filters
        intent = qs.get('intent', [None])[0]
        author = qs.get('author', [None])[0]
        search = qs.get('search', [None])[0]
        if intent:
            records = [r for r in records if r.get('attribution',{}).get('intent') == intent]
        if author:
            records = [r for r in records if author.lower() in r.get('attribution',{}).get('author',{}).get('name','').lower()]
        if search:
            s = search.lower()
            records = [r for r in records if s in r.get('commitHash','').lower() or s in r.get('attribution',{}).get('promptSummary','').lower() or s in r.get('attribution',{}).get('intent','').lower()]
        total = len(records)
        self._json({'total': total, 'records': records[offset:offset+limit]})

    def _read_records(self):
        DATA.parent.mkdir(parents=True, exist_ok=True)
        if not DATA.exists(): return []
        try: return json.loads(DATA.read_text())
        except: return []

    def _write_records(self, records):
        DATA.parent.mkdir(parents=True, exist_ok=True)
        DATA.write_text(json.dumps(records, indent=2, ensure_ascii=False))

    def _json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', len(body))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

PORT = 3000
print(f"\n  AI Attribution Dashboard (Python dev server)")
print(f"  http://localhost:{PORT}\n")
with socketserver.TCPServer(('0.0.0.0', PORT), Handler) as httpd:
    httpd.serve_forever()
