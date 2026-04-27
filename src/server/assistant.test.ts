import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GrowthRecord } from '../shared/types.js';

const geminiMock = vi.hoisted(() => ({
  constructor: vi.fn(),
  generateContent: vi.fn()
}));

vi.mock('@google/genai', () => ({
  Type: {
    OBJECT: 'OBJECT',
    ARRAY: 'ARRAY',
    STRING: 'STRING'
  },
  GoogleGenAI: class MockGoogleGenAI {
    models = {
      generateContent: geminiMock.generateContent
    };

    constructor(config: unknown) {
      geminiMock.constructor(config);
    }
  }
}));

const { generateSampleRecord, suggestChapters } = await import('./assistant.js');

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

const originalGeminiApiKey = process.env.GEMINI_API_KEY;
const originalGoogleApiKey = process.env.GOOGLE_API_KEY;
const originalModel = process.env.GEMINI_MODEL;

afterEach(() => {
  process.env.GEMINI_API_KEY = originalGeminiApiKey;
  process.env.GOOGLE_API_KEY = originalGoogleApiKey;
  process.env.GEMINI_MODEL = originalModel;
  geminiMock.constructor.mockReset();
  geminiMock.generateContent.mockReset();
});

describe('AI 보조 정리자', () => {
  it('Gemini 구조화 출력 성공 시 Gemini 챕터 제안을 반환한다', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.GEMINI_MODEL = 'gemini-2.5-flash';
    geminiMock.generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        chapters: [
          {
            title: '프로젝트 성장',
            summary: '프로젝트 기록을 중심으로 성장을 정리합니다.',
            recordIds: ['record-1', 'unknown-record'],
            missingQuestions: ['결과를 숫자로 표현할 수 있나요?']
          }
        ]
      })
    });

    const result = await suggestChapters(records);

    expect(result.source).toBe('gemini');
    expect(result.chapters).toEqual([
      {
        title: '프로젝트 성장',
        summary: '프로젝트 기록을 중심으로 성장을 정리합니다.',
        recordIds: ['record-1'],
        missingQuestions: ['결과를 숫자로 표현할 수 있나요?']
      }
    ]);
    expect(geminiMock.constructor).toHaveBeenCalledWith({ apiKey: 'test-key' });
    expect(geminiMock.generateContent).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-2.5-flash',
      config: expect.objectContaining({ responseMimeType: 'application/json' })
    }));
  });

  it('키가 없으면 Gemini SDK를 호출하지 않고 Mock 챕터 제안을 반환한다', async () => {
    process.env.GEMINI_API_KEY = '';
    process.env.GOOGLE_API_KEY = '';

    const result = await suggestChapters(records);

    expect(result.source).toBe('mock');
    expect(result.chapters).toHaveLength(1);
    expect(geminiMock.constructor).not.toHaveBeenCalled();
    expect(geminiMock.generateContent).not.toHaveBeenCalled();
  });

  it('Gemini API 오류가 나면 Mock 챕터 제안으로 fallback한다', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    geminiMock.generateContent.mockRejectedValueOnce(Object.assign(new Error('quota exceeded'), {
      status: 429,
      code: 'rate_limit_exceeded'
    }));

    const result = await suggestChapters(records);

    expect(result.source).toBe('mock');
    expect(result.chapters).toHaveLength(1);
    expect(result.chapters[0].recordIds).toEqual(['record-1']);
  });

  it('구조화 출력 누락 시 Mock 챕터 제안으로 fallback한다', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    geminiMock.generateContent.mockResolvedValueOnce({
      text: JSON.stringify({ chapters: [] })
    });

    const result = await suggestChapters(records);

    expect(result.source).toBe('mock');
    expect(result.chapters).toHaveLength(1);
  });

  it('Gemini 구조화 출력 성공 시 Gemini 예시 성장기록을 반환한다', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    geminiMock.generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        title: 'AI가 제안한 성장기록',
        category: 'learning',
        recordDate: '2026-04-28',
        summary: '학습 기록을 예시로 만들었다.',
        body: '새로운 개념을 정리하고 작은 실험으로 확인했다.',
        lesson: '개념은 직접 적용해볼 때 오래 남는다.',
        result: '다음 구현에서 같은 패턴을 더 빠르게 적용했다.',
        nextAction: '비슷한 사례를 한 번 더 기록한다.',
        tags: ['학습', '실험']
      })
    });

    const result = await generateSampleRecord();

    expect(result.source).toBe('gemini');
    expect(result.record).toEqual({
      title: 'AI가 제안한 성장기록',
      category: 'learning',
      recordDate: '2026-04-28',
      summary: '학습 기록을 예시로 만들었다.',
      body: '새로운 개념을 정리하고 작은 실험으로 확인했다.',
      lesson: '개념은 직접 적용해볼 때 오래 남는다.',
      result: '다음 구현에서 같은 패턴을 더 빠르게 적용했다.',
      nextAction: '비슷한 사례를 한 번 더 기록한다.',
      tags: ['학습', '실험']
    });
  });

  it('키가 없으면 Gemini SDK를 호출하지 않고 Mock 예시 성장기록을 반환한다', async () => {
    process.env.GEMINI_API_KEY = '';
    process.env.GOOGLE_API_KEY = '';

    const result = await generateSampleRecord();

    expect(result.source).toBe('mock');
    expect(result.record.title).toBeTruthy();
    expect(geminiMock.constructor).not.toHaveBeenCalled();
    expect(geminiMock.generateContent).not.toHaveBeenCalled();
  });

  it('Gemini 예시 성장기록이 잘못된 category를 반환하면 Mock fallback한다', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    geminiMock.generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        title: '잘못된 예시',
        category: 'career',
        recordDate: '2026-04-28',
        summary: '잘못된 카테고리',
        body: '본문',
        lesson: '배운 점',
        result: '결과',
        nextAction: '다음 행동',
        tags: ['오류']
      })
    });

    const result = await generateSampleRecord();

    expect(result.source).toBe('mock');
    expect(result.record.title).toBeTruthy();
  });

  it('Gemini 예시 성장기록 생성 오류가 나면 Mock fallback한다', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    geminiMock.generateContent.mockRejectedValueOnce(Object.assign(new Error('server error'), {
      status: 500
    }));

    const result = await generateSampleRecord();

    expect(result.source).toBe('mock');
    expect(result.record.title).toBeTruthy();
  });
});
