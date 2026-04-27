import express from 'express';
import path from 'node:path';
import type { GrowthCategory, OrderStatus } from '../shared/types.js';
import { suggestChapters } from './assistant.js';
import type { Repository } from './repository.js';

export function createApp(repo: Repository) {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'GrowthBook' });
  });

  app.get('/api/records', (_req, res) => {
    res.json(repo.listRecords());
  });

  app.get('/api/records/:id', (req, res) => {
    const record = repo.getRecord(req.params.id);
    if (!record) return res.status(404).json({ message: '성장기록을 찾을 수 없습니다.' });
    return res.json(record);
  });

  app.post('/api/records', (req, res) => {
    try {
      const record = repo.createRecord(normalizeRecordInput(req.body));
      res.status(201).json(record);
    } catch (error) {
      res.status(400).json({ message: message(error) });
    }
  });

  app.put('/api/records/:id', (req, res) => {
    try {
      const record = repo.updateRecord(req.params.id, normalizeRecordPatch(req.body));
      if (!record) return res.status(404).json({ message: '성장기록을 찾을 수 없습니다.' });
      return res.json(record);
    } catch (error) {
      return res.status(400).json({ message: message(error) });
    }
  });

  app.delete('/api/records/:id', (req, res) => {
    const deleted = repo.deleteRecord(req.params.id);
    if (!deleted) return res.status(404).json({ message: '성장기록을 찾을 수 없습니다.' });
    return res.status(204).send();
  });

  app.post('/api/assist/chapter-suggestions', async (req, res) => {
    const recordIds = asStringArray(req.body.recordIds);
    const records = repo.recordsByIds(recordIds);
    const result = await suggestChapters(records);
    res.json(result);
  });

  app.get('/api/orders', (_req, res) => {
    res.json(repo.listOrders());
  });

  app.get('/api/orders/:id', (req, res) => {
    const order = repo.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    return res.json({ ...order, records: repo.recordsByIds(order.recordIds) });
  });

  app.post('/api/orders', (req, res) => {
    try {
      const order = repo.createOrder({
        title: stringValue(req.body.title),
        authorName: stringValue(req.body.authorName),
        requestMemo: stringValue(req.body.requestMemo),
        recordIds: asStringArray(req.body.recordIds),
        chapters: Array.isArray(req.body.chapters) ? req.body.chapters : []
      });
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: message(error) });
    }
  });

  app.patch('/api/orders/:id/status', (req, res) => {
    try {
      const order = repo.updateOrderStatus(req.params.id, stringValue(req.body.status) as OrderStatus);
      if (!order) return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
      return res.json(order);
    } catch (error) {
      return res.status(400).json({ message: message(error) });
    }
  });

  app.get('/api/orders/:id/export', (req, res) => {
    const order = repo.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    const payload = {
      order,
      records: repo.recordsByIds(order.recordIds),
      metadata: {
        exportedAt: new Date().toISOString(),
        formatVersion: '1.0',
        partner: 'sweetbook-mock',
        service: 'GrowthBook',
        contentType: 'growth-record-book'
      }
    };
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="growthbook-${order.id}.json"`);
    res.send(JSON.stringify(payload, null, 2));
  });

  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  return app;
}

function normalizeRecordInput(body: Record<string, unknown>) {
  return {
    title: stringValue(body.title),
    category: stringValue(body.category) as GrowthCategory,
    recordDate: stringValue(body.recordDate),
    summary: stringValue(body.summary),
    body: stringValue(body.body),
    lesson: stringValue(body.lesson),
    result: stringValue(body.result),
    nextAction: stringValue(body.nextAction),
    tags: asStringArray(body.tags)
  };
}

function normalizeRecordPatch(body: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};
  for (const key of ['title', 'category', 'recordDate', 'summary', 'body', 'lesson', 'result', 'nextAction']) {
    if (key in body) patch[key] = key === 'category' ? stringValue(body[key]) as GrowthCategory : stringValue(body[key]);
  }
  if ('tags' in body) patch.tags = asStringArray(body.tags);
  return patch;
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function message(error: unknown) {
  return error instanceof Error ? error.message : '요청을 처리할 수 없습니다.';
}
