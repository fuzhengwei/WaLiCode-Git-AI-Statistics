import express from 'express';
import cors from 'cors';
import { addRecord, getRecords, getStats, clearAll, deleteRecord, type FilterOptions } from './store';
import { WebhookPayload, StoredRecord } from './types';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 静态文件（生产模式）
import path from 'path';
import fs from 'fs';
const clientDist = fs.existsSync(path.join(__dirname, '..', 'dist', 'client'))
  ? path.join(__dirname, '..', 'dist', 'client')
  : path.join(__dirname, '..', 'client');
app.use('/assets', express.static(path.join(clientDist, 'assets')));
app.get('/', (_, res) => {
  const idx = path.join(clientDist, 'index.html');
  if (fs.existsSync(idx)) {
    res.sendFile(idx);
  } else {
    res.send('AI Attribution Dashboard — run <code>npm run build</code> first, or use <code>npm run dev</code>');
  }
});

// ===== Webhook 接收端点 =====
app.post('/webhook/ai-attribution', (req, res) => {
  const payload = req.body as WebhookPayload;

  // 测试连接请求
  if ((payload.event as string) === 'test' || (payload as any).test === true) {
    console.log('[webhook] Test connection received');
    res.json({ ok: true, message: 'Connection test passed' });
    return;
  }

  if (!payload.commitHash || !payload.attribution) {
    res.status(400).json({ error: 'Missing commitHash or attribution' });
    return;
  }

  const record: StoredRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    receivedAt: Date.now(),
    commitHash: payload.commitHash,
    repoRoot: payload.repoRoot || '',
    event: payload.event || 'commit',
    attribution: payload.attribution,
  };

  addRecord(record);
  console.log(
    `[webhook] ${payload.commitHash.slice(0, 7)} — ${payload.attribution.intent || 'unknown'} — ${payload.attribution.totalAiLines} AI lines`
  );

  res.json({ ok: true, id: record.id });
});

// ===== API 端点 =====
app.get('/api/records', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = parseInt(req.query.offset as string) || 0;

  const filters: FilterOptions = {};
  if (req.query.intent) filters.intent = req.query.intent as string;
  if (req.query.author) filters.author = req.query.author as string;
  if (req.query.search) filters.search = req.query.search as string;

  res.json(getRecords(limit, offset, filters));
});

app.get('/api/stats', (_, res) => {
  res.json(getStats());
});

app.delete('/api/records', (_, res) => {
  clearAll();
  res.json({ ok: true });
});

app.delete('/api/records/:id', (req, res) => {
  const ok = deleteRecord(req.params.id);
  if (!ok) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  res.json({ ok: true });
});

// 启动
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`\n  AI Attribution Dashboard`);
  console.log(`  Webhook: POST http://localhost:${PORT}/webhook/ai-attribution`);
  console.log(`  API:     GET  http://localhost:${PORT}/api/records`);
  console.log(`           GET  http://localhost:${PORT}/api/stats`);
  console.log(`  UI:      http://localhost:${PORT}\n`);
});
