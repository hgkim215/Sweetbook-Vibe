import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { BookOrder, ChapterSuggestion, GrowthCategory, GrowthRecord, OrderStatus } from '../shared/types.js';
import { sampleRecordTemplates } from './sample-records.js';

type RecordRow = Omit<GrowthRecord, 'tags'> & { tags: string };
type OrderRow = Omit<BookOrder, 'recordIds' | 'chapters'> & { recordIds: string; chapters: string };

const categories: GrowthCategory[] = ['project', 'learning', 'failure', 'improvement', 'reflection', 'impact'];
const statuses: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled'];
const allowedOrderTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

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
      const currentOrder = parseOrder(current);
      if (!allowedOrderTransitions[currentOrder.status].includes(status)) {
        throw new Error(`주문 상태를 ${statusLabel(currentOrder.status)}에서 ${statusLabel(status)}로 변경할 수 없습니다.`);
      }
      const updatedAt = new Date().toISOString();
      db.prepare('UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?').run(status, updatedAt, idValue);
      return { ...currentOrder, status, updatedAt };
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

function statusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    pending: '대기',
    processing: '처리 중',
    completed: '완료',
    cancelled: '취소'
  };
  return labels[status];
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
  return sampleRecordTemplates().map((record, index) => ({
    ...record,
    id: `rec_seed_${index + 1}`,
    createdAt: now,
    updatedAt: now
  }));
}

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
