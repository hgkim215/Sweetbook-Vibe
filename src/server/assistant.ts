import { GoogleGenAI, Type } from '@google/genai';
import type { ChapterSuggestion, GrowthRecord } from '../shared/types.js';

const chapterSuggestionsSchema = {
  type: Type.OBJECT,
  properties: {
    chapters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          recordIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          missingQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ['title', 'summary', 'recordIds', 'missingQuestions']
      }
    }
  },
  required: ['chapters']
};

export async function suggestChapters(records: GrowthRecord[]): Promise<{ source: 'gemini' | 'mock'; chapters: ChapterSuggestion[] }> {
  if (records.length === 0) {
    return { source: 'mock', chapters: [] };
  }

  if (geminiApiKey()) {
    try {
      const chapters = await suggestWithGemini(records);
      if (chapters.length > 0) {
        return { source: 'gemini', chapters };
      }
    } catch (error) {
      console.warn('[assistant] Gemini 제안 실패, Mock 제안으로 전환합니다.', aiErrorSummary(error));
    }
  }

  return { source: 'mock', chapters: suggestWithRules(records) };
}

function suggestWithRules(records: GrowthRecord[]): ChapterSuggestion[] {
  const groups = new Map<string, GrowthRecord[]>();
  for (const record of records) {
    const key = record.category;
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }

  return [...groups.entries()].map(([category, group]) => ({
    title: chapterTitle(category),
    summary: `${group.length}개의 성장기록을 묶어 ${chapterTitle(category)} 흐름으로 정리합니다.`,
    recordIds: group.map((record) => record.id),
    missingQuestions: [
      '이 경험 이전과 이후에 달라진 행동은 무엇인가요?',
      '결과를 숫자나 관찰 가능한 변화로 표현할 수 있나요?'
    ]
  }));
}

async function suggestWithGemini(records: GrowthRecord[]): Promise<ChapterSuggestion[]> {
  const client = new GoogleGenAI({ apiKey: geminiApiKey() });
  const response = await client.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    contents: [
      [
        '너는 GrowthBook의 성장기록집 챕터 구성을 돕는 보조 정리자다.',
        '사용자가 작성한 성장기록에 없는 사실은 만들지 않는다.',
        '챕터는 1개 이상 제안하되, recordIds는 입력으로 받은 성장기록 id만 사용한다.',
        'missingQuestions는 사용자가 보완하면 좋은 질문만 간결하게 작성한다.',
        '',
        `아래 성장기록으로 성장기록집 챕터를 JSON으로 제안해줘.\n${JSON.stringify(records, null, 2)}`
      ].join('\n')
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: chapterSuggestionsSchema
    }
  });

  const parsed = parseGeminiChapters(response.text);
  return normalizeAIChapters(parsed.chapters, records);
}

function parseGeminiChapters(text: string | undefined): { chapters: ChapterSuggestion[] } {
  if (!text) return { chapters: [] };
  const parsed = JSON.parse(text) as { chapters?: unknown };
  if (!Array.isArray(parsed.chapters)) return { chapters: [] };
  return {
    chapters: parsed.chapters.filter(isChapterSuggestion)
  };
}

function isChapterSuggestion(value: unknown): value is ChapterSuggestion {
  if (!value || typeof value !== 'object') return false;
  const chapter = value as Partial<ChapterSuggestion>;
  return typeof chapter.title === 'string'
    && typeof chapter.summary === 'string'
    && Array.isArray(chapter.recordIds)
    && chapter.recordIds.every((id) => typeof id === 'string')
    && Array.isArray(chapter.missingQuestions)
    && chapter.missingQuestions.every((question) => typeof question === 'string');
}

function normalizeAIChapters(chapters: ChapterSuggestion[], records: GrowthRecord[]) {
  const allowedIds = new Set(records.map((record) => record.id));
  return chapters
    .map((chapter) => ({
      title: chapter.title.trim(),
      summary: chapter.summary.trim(),
      recordIds: chapter.recordIds.filter((id) => allowedIds.has(id)),
      missingQuestions: chapter.missingQuestions.map((question) => question.trim()).filter(Boolean)
    }))
    .filter((chapter) => chapter.title && chapter.summary && chapter.recordIds.length > 0);
}

function geminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
}

function aiErrorSummary(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: '알 수 없는 Gemini 오류' };
  }
  const maybeApiError = error as Error & { status?: number; code?: string; type?: string };
  return {
    message: error.message,
    status: maybeApiError.status,
    code: maybeApiError.code,
    type: maybeApiError.type
  };
}

function chapterTitle(category: string) {
  const titles: Record<string, string> = {
    project: '프로젝트로 증명한 성장',
    learning: '학습으로 넓힌 기반',
    failure: '실패에서 바꾼 판단',
    improvement: '반복 개선으로 만든 변화',
    reflection: '회고로 정리한 방향',
    impact: '결과로 남은 성장'
  };
  return titles[category] ?? '성장 기록 모음';
}
