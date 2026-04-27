import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { createRepository, type Repository } from './repository.js';

let repo: Repository;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  const dir = mkdtempSync(path.join(tmpdir(), 'growthbook-'));
  repo = createRepository(path.join(dir, 'test.sqlite'));
  app = createApp(repo);
});

afterEach(() => {
  repo.close();
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
    const exported = await request(app).get(`/api/orders/${order.body.id}/export`).expect(200);
    expect(exported.body.metadata.partner).toBe('sweetbook-mock');
    expect(exported.body.records.length).toBe(recordIds.length);
  });
});

