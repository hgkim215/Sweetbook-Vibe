import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GrowthRecord } from '../shared/types.js';

const openAIMock = vi.hoisted(() => ({
  constructor: vi.fn(),
  parse: vi.fn()
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    responses = {
      parse: openAIMock.parse
    };

    constructor(config: unknown) {
      openAIMock.constructor(config);
    }
  }
}));

const { suggestChapters } = await import('./assistant.js');

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

const originalApiKey = process.env.OPENAI_API_KEY;
const originalModel = process.env.OPENAI_MODEL;

afterEach(() => {
  process.env.OPENAI_API_KEY = originalApiKey;
  process.env.OPENAI_MODEL = originalModel;
  openAIMock.constructor.mockReset();
  openAIMock.parse.mockReset();
});

describe('AI 보조 정리자', () => {
  it('OpenAI SDK 구조화 출력 성공 시 OpenAI 챕터 제안을 반환한다', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_MODEL = 'gpt-5.4';
    openAIMock.parse.mockResolvedValueOnce({
      output_parsed: {
        chapters: [
          {
            title: '프로젝트 성장',
            summary: '프로젝트 기록을 중심으로 성장을 정리합니다.',
            recordIds: ['record-1', 'unknown-record'],
            missingQuestions: ['결과를 숫자로 표현할 수 있나요?']
          }
        ]
      }
    });

    const result = await suggestChapters(records);

    expect(result.source).toBe('openai');
    expect(result.chapters).toEqual([
      {
        title: '프로젝트 성장',
        summary: '프로젝트 기록을 중심으로 성장을 정리합니다.',
        recordIds: ['record-1'],
        missingQuestions: ['결과를 숫자로 표현할 수 있나요?']
      }
    ]);
    expect(openAIMock.constructor).toHaveBeenCalledWith({ apiKey: 'test-key' });
    expect(openAIMock.parse).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-5.4' }));
  });

  it('키가 없으면 OpenAI SDK를 호출하지 않고 Mock 챕터 제안을 반환한다', async () => {
    process.env.OPENAI_API_KEY = '';

    const result = await suggestChapters(records);

    expect(result.source).toBe('mock');
    expect(result.chapters).toHaveLength(1);
    expect(openAIMock.constructor).not.toHaveBeenCalled();
    expect(openAIMock.parse).not.toHaveBeenCalled();
  });

  it('OpenAI API 429 오류가 나면 Mock 챕터 제안으로 fallback한다', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    openAIMock.parse.mockRejectedValueOnce(Object.assign(new Error('quota exceeded'), {
      status: 429,
      code: 'rate_limit_exceeded'
    }));

    const result = await suggestChapters(records);

    expect(result.source).toBe('mock');
    expect(result.chapters).toHaveLength(1);
    expect(result.chapters[0].recordIds).toEqual(['record-1']);
  });

  it('refusal 또는 구조화 출력 누락 시 Mock 챕터 제안으로 fallback한다', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    openAIMock.parse.mockResolvedValueOnce({
      output_parsed: null,
      output: [
        {
          type: 'message',
          content: [
            {
              type: 'refusal',
              refusal: '요청을 처리할 수 없습니다.'
            }
          ]
        }
      ]
    });

    const result = await suggestChapters(records);

    expect(result.source).toBe('mock');
    expect(result.chapters).toHaveLength(1);
  });
});
