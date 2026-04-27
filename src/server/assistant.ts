import type { ChapterSuggestion, GrowthRecord } from '../shared/types.js';

export async function suggestChapters(records: GrowthRecord[]): Promise<{ source: 'openai' | 'mock'; chapters: ChapterSuggestion[] }> {
  if (records.length === 0) {
    return { source: 'mock', chapters: [] };
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const chapters = await suggestWithOpenAI(records);
      if (chapters.length > 0) {
        return { source: 'openai', chapters };
      }
    } catch (error) {
      console.warn('[assistant] OpenAI 제안 실패, Mock 제안으로 전환합니다.', error);
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

async function suggestWithOpenAI(records: GrowthRecord[]): Promise<ChapterSuggestion[]> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5.4',
      input: `아래 성장기록을 바탕으로 성장기록집 챕터를 JSON 배열로만 제안해줘. 각 항목은 title, summary, recordIds, missingQuestions를 가져야 해. 사용자가 쓰지 않은 사실은 만들지 마.\n\n${JSON.stringify(records, null, 2)}`
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API 오류: ${response.status}`);
  }

  const data = await response.json() as {
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  const text = data.output?.flatMap((item) => item.content ?? [])
    .find((part) => part.type === 'output_text')?.text;
  if (!text) return [];
  const parsed = JSON.parse(text) as ChapterSuggestion[];
  return parsed.filter((chapter) => Array.isArray(chapter.recordIds));
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

