import { GoogleGenAI, Type } from '@google/genai';
import type { ChapterSuggestion, GrowthCategory, GrowthRecord } from '../shared/types.js';
import { randomSampleRecord, type GrowthRecordInput } from './sample-records.js';

type AssistantSource = 'gemini' | 'mock';

const categories: GrowthCategory[] = ['project', 'learning', 'failure', 'improvement', 'reflection', 'impact'];

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

const sampleRecordSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    category: { type: Type.STRING },
    recordDate: { type: Type.STRING },
    summary: { type: Type.STRING },
    body: { type: Type.STRING },
    lesson: { type: Type.STRING },
    result: { type: Type.STRING },
    nextAction: { type: Type.STRING },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ['title', 'category', 'recordDate', 'summary', 'body', 'lesson', 'result', 'nextAction', 'tags']
};

export async function suggestChapters(records: GrowthRecord[]): Promise<{ source: AssistantSource; chapters: ChapterSuggestion[] }> {
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

export async function generateSampleRecord(): Promise<{ source: AssistantSource; record: GrowthRecordInput }> {
  if (geminiApiKey()) {
    try {
      const record = await generateSampleRecordWithGemini();
      if (record) {
        return { source: 'gemini', record };
      }
    } catch (error) {
      console.warn('[assistant] Gemini 예시 기록 생성 실패, Mock 예시로 전환합니다.', aiErrorSummary(error));
    }
  }

  return { source: 'mock', record: randomSampleRecord() };
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

async function generateSampleRecordWithGemini(): Promise<GrowthRecordInput | null> {
  const client = new GoogleGenAI({ apiKey: geminiApiKey() });
  const response = await client.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    contents: [
      [
        '너는 GrowthBook의 데모용 성장기록 생성을 돕는 보조 정리자다.',
        '실제 개인정보, 특정 회사명, 특정 학교명, 확인 불가능한 과장 성과는 쓰지 않는다.',
        '취준생, 주니어 개발자, 학습자가 남길 법한 성장기록 1개만 만든다.',
        `category는 반드시 ${categories.join(', ')} 중 하나만 사용한다.`,
        'recordDate는 YYYY-MM-DD 형식으로 작성한다.',
        'tags는 한국어 태그 2~4개로 작성한다.',
        '',
        'GrowthBook 성장기록 JSON 1개를 생성해줘.'
      ].join('\n')
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: sampleRecordSchema
    }
  });

  return parseGeminiSampleRecord(response.text);
}

function parseGeminiChapters(text: string | undefined): { chapters: ChapterSuggestion[] } {
  if (!text) return { chapters: [] };
  const parsed = JSON.parse(text) as { chapters?: unknown };
  if (!Array.isArray(parsed.chapters)) return { chapters: [] };
  return {
    chapters: parsed.chapters.filter(isChapterSuggestion)
  };
}

function parseGeminiSampleRecord(text: string | undefined): GrowthRecordInput | null {
  if (!text) return null;
  return normalizeSampleRecord(JSON.parse(text));
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

function normalizeSampleRecord(value: unknown): GrowthRecordInput | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Partial<GrowthRecordInput>;
  if (typeof record.category !== 'string' || !categories.includes(record.category as GrowthCategory)) return null;
  if (!Array.isArray(record.tags) || !record.tags.every((tag) => typeof tag === 'string')) return null;

  const normalized: GrowthRecordInput = {
    title: stringField(record.title),
    category: record.category as GrowthCategory,
    recordDate: stringField(record.recordDate),
    summary: stringField(record.summary),
    body: stringField(record.body),
    lesson: stringField(record.lesson),
    result: stringField(record.result),
    nextAction: stringField(record.nextAction),
    tags: record.tags.map((tag) => tag.trim()).filter(Boolean)
  };

  const requiredTexts = [
    normalized.title,
    normalized.recordDate,
    normalized.summary,
    normalized.body,
    normalized.lesson,
    normalized.result,
    normalized.nextAction
  ];
  if (requiredTexts.some((item) => !item) || normalized.tags.length === 0) return null;
  return normalized;
}

function stringField(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
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
