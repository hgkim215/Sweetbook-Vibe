import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { BookOrder, ChapterSuggestion, GrowthCategory, GrowthRecord, OrderStatus } from '../shared/types.js';

type RecordRow = Omit<GrowthRecord, 'tags'> & { tags: string };
type OrderRow = Omit<BookOrder, 'recordIds' | 'chapters'> & { recordIds: string; chapters: string };

const categories: GrowthCategory[] = ['project', 'learning', 'failure', 'improvement', 'reflection', 'impact'];
const statuses: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled'];

export function createRepository(dbPath: string) {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      recordDate TEXT NOT NULL,
      summary TEXT NOT NULL,
      body TEXT NOT NULL,
      lesson TEXT NOT NULL,
      result TEXT NOT NULL,
      nextAction TEXT NOT NULL,
      tags TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      authorName TEXT NOT NULL,
      requestMemo TEXT NOT NULL,
      status TEXT NOT NULL,
      recordIds TEXT NOT NULL,
      chapters TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  seedIfEmpty(db);

  return {
    close: () => db.close(),
    listRecords: (): GrowthRecord[] =>
      db.prepare('SELECT * FROM records ORDER BY recordDate DESC, createdAt DESC').all().map(parseRecord),
    getRecord: (id: string): GrowthRecord | null => {
      const row = db.prepare('SELECT * FROM records WHERE id = ?').get(id);
      return row ? parseRecord(row) : null;
    },
    createRecord: (input: Omit<GrowthRecord, 'id' | 'createdAt' | 'updatedAt'>): GrowthRecord => {
      const now = new Date().toISOString();
      const record: GrowthRecord = { ...input, id: id('rec'), createdAt: now, updatedAt: now };
      validateRecord(record);
      db.prepare(`
        INSERT INTO records
        (id, title, category, recordDate, summary, body, lesson, result, nextAction, tags, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        record.id,
        record.title,
        record.category,
        record.recordDate,
        record.summary,
        record.body,
        record.lesson,
        record.result,
        record.nextAction,
        JSON.stringify(record.tags),
        record.createdAt,
        record.updatedAt
      );
      return record;
    },
    updateRecord: (idValue: string, input: Partial<Omit<GrowthRecord, 'id' | 'createdAt' | 'updatedAt'>>): GrowthRecord | null => {
      const current = db.prepare('SELECT * FROM records WHERE id = ?').get(idValue);
      if (!current) return null;
      const record = { ...parseRecord(current), ...input, id: idValue, updatedAt: new Date().toISOString() };
      validateRecord(record);
      db.prepare(`
        UPDATE records SET
          title = ?, category = ?, recordDate = ?, summary = ?, body = ?, lesson = ?,
          result = ?, nextAction = ?, tags = ?, updatedAt = ?
        WHERE id = ?
      `).run(
        record.title,
        record.category,
        record.recordDate,
        record.summary,
        record.body,
        record.lesson,
        record.result,
        record.nextAction,
        JSON.stringify(record.tags),
        record.updatedAt,
        idValue
      );
      return record;
    },
    deleteRecord: (idValue: string): boolean => {
      const existing = db.prepare('SELECT id FROM records WHERE id = ?').get(idValue);
      if (!existing) return false;
      db.prepare('DELETE FROM records WHERE id = ?').run(idValue);
      return true;
    },
    listOrders: (): BookOrder[] =>
      db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all().map(parseOrder),
    getOrder: (idValue: string): BookOrder | null => {
      const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(idValue);
      return row ? parseOrder(row) : null;
    },
    createOrder: (input: Omit<BookOrder, 'id' | 'status' | 'createdAt' | 'updatedAt'>): BookOrder => {
      const now = new Date().toISOString();
      const order: BookOrder = {
        ...input,
        id: id('ord'),
        status: 'pending',
        createdAt: now,
        updatedAt: now
      };
      validateOrder(order);
      db.prepare(`
        INSERT INTO orders
        (id, title, authorName, requestMemo, status, recordIds, chapters, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        order.id,
        order.title,
        order.authorName,
        order.requestMemo,
        order.status,
        JSON.stringify(order.recordIds),
        JSON.stringify(order.chapters),
        order.createdAt,
        order.updatedAt
      );
      return order;
    },
    updateOrderStatus: (idValue: string, status: OrderStatus): BookOrder | null => {
      if (!statuses.includes(status)) throw new Error('지원하지 않는 주문 상태입니다.');
      const current = db.prepare('SELECT * FROM orders WHERE id = ?').get(idValue);
      if (!current) return null;
      const updatedAt = new Date().toISOString();
      db.prepare('UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?').run(status, updatedAt, idValue);
      return parseOrder({ ...(current as OrderRow), status, updatedAt });
    },
    recordsByIds: (recordIds: string[]): GrowthRecord[] => recordIds
      .map((recordId) => db.prepare('SELECT * FROM records WHERE id = ?').get(recordId))
      .filter(Boolean)
      .map(parseRecord)
  };
}

export type Repository = ReturnType<typeof createRepository>;

function parseRecord(row: unknown): GrowthRecord {
  const item = row as RecordRow;
  return { ...item, tags: JSON.parse(item.tags) as string[] };
}

function parseOrder(row: unknown): BookOrder {
  const item = row as OrderRow;
  return {
    ...item,
    status: item.status as OrderStatus,
    recordIds: JSON.parse(item.recordIds) as string[],
    chapters: JSON.parse(item.chapters) as ChapterSuggestion[]
  };
}

function validateRecord(record: GrowthRecord) {
  if (!record.title.trim()) throw new Error('제목은 필수입니다.');
  if (!categories.includes(record.category)) throw new Error('지원하지 않는 카테고리입니다.');
  if (!record.recordDate.trim()) throw new Error('기록 날짜는 필수입니다.');
  if (!record.summary.trim()) throw new Error('요약은 필수입니다.');
}

function validateOrder(order: BookOrder) {
  if (!order.title.trim()) throw new Error('책 제목은 필수입니다.');
  if (!order.authorName.trim()) throw new Error('작성자명은 필수입니다.');
  if (order.recordIds.length === 0) throw new Error('주문에는 성장기록이 최소 1개 필요합니다.');
  if (!statuses.includes(order.status)) throw new Error('지원하지 않는 주문 상태입니다.');
}

function seedIfEmpty(db: DatabaseSync) {
  const count = db.prepare('SELECT COUNT(*) as count FROM records').get() as { count: number };
  if (count.count > 0) return;
  for (const record of seedRecords()) {
    db.prepare(`
      INSERT INTO records
      (id, title, category, recordDate, summary, body, lesson, result, nextAction, tags, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.title,
      record.category,
      record.recordDate,
      record.summary,
      record.body,
      record.lesson,
      record.result,
      record.nextAction,
      JSON.stringify(record.tags),
      record.createdAt,
      record.updatedAt
    );
  }
}

function seedRecords(): GrowthRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'rec_seed_1',
      title: '첫 사용자 인터뷰에서 문제를 다시 정의한 날',
      category: 'reflection',
      recordDate: '2026-02-12',
      summary: '기능 아이디어보다 사용자의 실제 막힘을 먼저 봐야 한다는 기준을 세웠다.',
      body: '프로젝트 초반에는 기능 목록부터 늘렸지만, 인터뷰 이후 사용자가 실제로 어려워하는 지점이 기록 정리와 설명이라는 것을 확인했다.',
      lesson: '문제 정의가 약하면 구현 속도보다 방향이 먼저 흔들린다.',
      result: '인터뷰 질문을 다시 구성하고 핵심 플로우를 줄였다.',
      nextAction: '다음 프로젝트에서는 요구사항보다 사용자 행동 증거를 먼저 정리한다.',
      tags: ['인터뷰', '문제정의', '회고'],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'rec_seed_2',
      title: '반복 검증 스크립트를 만든 경험',
      category: 'improvement',
      recordDate: '2026-03-03',
      summary: '매번 수동으로 확인하던 빌드와 테스트를 스크립트로 묶었다.',
      body: '작은 수정에도 같은 검증을 반복하면서 누락이 생겼다. 빠른 검증과 전체 검증을 나눠 실행 시간을 줄이고 안정성을 높였다.',
      lesson: '검증 루프는 개발 속도를 늦추는 장치가 아니라 다음 결정을 빠르게 만드는 장치다.',
      result: '수정 후 확인 시간이 줄고 회귀를 더 빨리 잡을 수 있었다.',
      nextAction: '새 프로젝트에서도 첫날부터 검증 명령을 문서화한다.',
      tags: ['하네스', '자동화', '테스트'],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'rec_seed_3',
      title: '실패한 데모를 기준으로 범위를 줄인 결정',
      category: 'failure',
      recordDate: '2026-03-21',
      summary: '기능을 많이 넣는 대신 핵심 흐름을 끝까지 완성하는 쪽으로 방향을 바꿨다.',
      body: '초기 데모에서 화면은 많았지만 사용자가 끝까지 완료할 수 있는 플로우가 약했다. 이후 핵심 작업 하나를 끝까지 닫는 구조로 범위를 줄였다.',
      lesson: '완성도는 기능 수보다 사용자가 목표를 끝낼 수 있는지에서 나온다.',
      result: '시연 흐름이 짧아지고 설명이 쉬워졌다.',
      nextAction: '새 기능은 Lv1 플로우가 안정된 뒤 추가한다.',
      tags: ['실패', '범위조절', 'MVP'],
      createdAt: now,
      updatedAt: now
    }
  ];
}

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

