import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { createRepository, type Repository } from './repository.js';

let repo: Repository;
let app: ReturnType<typeof createApp>;
const originalGeminiApiKey = process.env.GEMINI_API_KEY;
const originalGoogleApiKey = process.env.GOOGLE_API_KEY;

beforeEach(() => {
  process.env.GEMINI_API_KEY = '';
  process.env.GOOGLE_API_KEY = '';
  const dir = mkdtempSync(path.join(tmpdir(), 'growthbook-'));
  repo = createRepository(path.join(dir, 'test.sqlite'));
  app = createApp(repo);
});

afterEach(() => {
  repo.close();
  process.env.GEMINI_API_KEY = originalGeminiApiKey;
  process.env.GOOGLE_API_KEY = originalGoogleApiKey;
});

describe('GrowthBook API', () => {
  it('더미 성장기록을 조회한다', async () => {
    const response = await request(app).get('/api/records').expect(200);
    expect(response.body.length).toBeGreaterThanOrEqual(3);
  });

  it('성장기록을 생성하고 수정하고 삭제한다', async () => {
    const created = await request(app).post('/api/records').send({
      title: '테스트 성장기록',
      category: 'learning',
      recordDate: '2026-04-28',
      summary: '테스트 요약',
      body: '테스트 본문',
      lesson: '테스트 배운 점',
      result: '테스트 결과',
      nextAction: '다음 행동',
      tags: ['테스트']
    }).expect(201);

    await request(app).put(`/api/records/${created.body.id}`).send({ title: '수정된 성장기록' }).expect(200);
    await request(app).delete(`/api/records/${created.body.id}`).expect(204);
  });

  it('AI 예시 성장기록을 1개 생성해 목록에 추가한다', async () => {
    const before = await request(app).get('/api/records').expect(200);

    const created = await request(app).post('/api/assist/sample-record').expect(201);

    expect(created.body.source).toBe('mock');
    expect(created.body.record.id).toBeTruthy();
    expect(created.body.record.title).toBeTruthy();

    const after = await request(app).get('/api/records').expect(200);
    expect(after.body).toHaveLength(before.body.length + 1);
    expect(after.body.some((record: { id: string }) => record.id === created.body.record.id)).toBe(true);
  });

  it('Mock 챕터 제안, 주문 생성, 상태 변경, 익스포트를 처리한다', async () => {
    const records = await request(app).get('/api/records').expect(200);
    const recordIds = records.body.slice(0, 2).map((record: { id: string }) => record.id);

    const suggestions = await request(app)
      .post('/api/assist/chapter-suggestions')
      .send({ recordIds })
      .expect(200);
    expect(suggestions.body.source).toBe('mock');

    const order = await request(app).post('/api/orders').send({
      title: '나의 성장기록집',
      authorName: '김현기',
      requestMemo: '시간순 흐름이 보이게 구성해주세요.',
      recordIds,
      chapters: suggestions.body.chapters
    }).expect(201);

    await request(app).patch(`/api/orders/${order.body.id}/status`).send({ status: 'processing' }).expect(200);
    await request(app).patch(`/api/orders/${order.body.id}/status`).send({ status: 'pending' }).expect(400);
    await request(app).patch(`/api/orders/${order.body.id}/status`).send({ status: 'completed' }).expect(200);
    await request(app).patch(`/api/orders/${order.body.id}/status`).send({ status: 'cancelled' }).expect(400);
    const exported = await request(app).get(`/api/orders/${order.body.id}/export`).expect(200);
    expect(exported.body.metadata.partner).toBe('sweetbook-mock');
    expect(exported.body.records.length).toBe(recordIds.length);
  });

  it('대기 주문은 취소할 수 있고 취소 후 다시 처리할 수 없다', async () => {
    const records = await request(app).get('/api/records').expect(200);
    const recordIds = records.body.slice(0, 1).map((record: { id: string }) => record.id);

    const order = await request(app).post('/api/orders').send({
      title: '취소 테스트 성장기록집',
      authorName: '김현기',
      requestMemo: '취소 흐름 검증',
      recordIds,
      chapters: []
    }).expect(201);

    await request(app).patch(`/api/orders/${order.body.id}/status`).send({ status: 'cancelled' }).expect(200);
    await request(app).patch(`/api/orders/${order.body.id}/status`).send({ status: 'processing' }).expect(400);
  });
});
