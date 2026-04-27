import { afterEach, describe, expect, it, vi } from 'vitest';
import { suggestChapters } from './assistant.js';
import type { GrowthRecord } from '../shared/types.js';

const records: GrowthRecord[] = [
  {
    id: 'record-1',
    title: '첫 프로젝트 회고',
    category: 'project',
    recordDate: '2026-04-01',
    summary: '프로젝트에서 역할과 결과를 정리했다.',
    body: '기록 본문',
    lesson: '작게 검증하는 습관',
    result: '검증 속도 개선',
    nextAction: '다음 프로젝트에 적용',
    tags: ['프로젝트'],
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z'
  }
];

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.OPENAI_API_KEY = originalApiKey;
  vi.restoreAllMocks();
});

describe('AI 보조 정리자 fallback', () => {
  it('OpenAI API 오류가 나면 Mock 챕터 제안으로 fallback한다', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    globalThis.fetch = vi.fn(async () => new Response('unauthorized', { status: 401 })) as typeof fetch;

    const result = await suggestChapters(records);

    expect(result.source).toBe('mock');
    expect(result.chapters).toHaveLength(1);
    expect(result.chapters[0].recordIds).toEqual(['record-1']);
  });

  it('OpenAI 응답 JSON 파싱에 실패하면 Mock 챕터 제안으로 fallback한다', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    globalThis.fetch = vi.fn(async () => Response.json({
      output: [
        {
          content: [
            {
              type: 'output_text',
              text: 'JSON이 아닌 응답'
            }
          ]
        }
      ]
    })) as typeof fetch;

    const result = await suggestChapters(records);

    expect(result.source).toBe('mock');
    expect(result.chapters).toHaveLength(1);
  });
});
