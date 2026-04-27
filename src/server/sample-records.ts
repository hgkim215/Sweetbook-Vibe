import type { GrowthRecord } from '../shared/types.js';

export type GrowthRecordInput = Omit<GrowthRecord, 'id' | 'createdAt' | 'updatedAt'>;

const samples: GrowthRecordInput[] = [
  {
    title: '첫 사용자 인터뷰에서 문제를 다시 정의한 날',
    category: 'reflection',
    recordDate: '2026-02-12',
    summary: '기능 아이디어보다 사용자의 실제 막힘을 먼저 봐야 한다는 기준을 세웠다.',
    body: '프로젝트 초반에는 기능 목록부터 늘렸지만, 인터뷰 이후 사용자가 실제로 어려워하는 지점이 기록 정리와 설명이라는 것을 확인했다.',
    lesson: '문제 정의가 약하면 구현 속도보다 방향이 먼저 흔들린다.',
    result: '인터뷰 질문을 다시 구성하고 핵심 플로우를 줄였다.',
    nextAction: '다음 프로젝트에서는 요구사항보다 사용자 행동 증거를 먼저 정리한다.',
    tags: ['인터뷰', '문제정의', '회고']
  },
  {
    title: '반복 검증 스크립트를 만든 경험',
    category: 'improvement',
    recordDate: '2026-03-03',
    summary: '매번 수동으로 확인하던 빌드와 테스트를 스크립트로 묶었다.',
    body: '작은 수정에도 같은 검증을 반복하면서 누락이 생겼다. 빠른 검증과 전체 검증을 나눠 실행 시간을 줄이고 안정성을 높였다.',
    lesson: '검증 루프는 개발 속도를 늦추는 장치가 아니라 다음 결정을 빠르게 만드는 장치다.',
    result: '수정 후 확인 시간이 줄고 회귀를 더 빨리 잡을 수 있었다.',
    nextAction: '새 프로젝트에서도 첫날부터 검증 명령을 문서화한다.',
    tags: ['하네스', '자동화', '테스트']
  },
  {
    title: '실패한 데모를 기준으로 범위를 줄인 결정',
    category: 'failure',
    recordDate: '2026-03-21',
    summary: '기능을 많이 넣는 대신 핵심 흐름을 끝까지 완성하는 쪽으로 방향을 바꿨다.',
    body: '초기 데모에서 화면은 많았지만 사용자가 끝까지 완료할 수 있는 플로우가 약했다. 이후 핵심 작업 하나를 끝까지 닫는 구조로 범위를 줄였다.',
    lesson: '완성도는 기능 수보다 사용자가 목표를 끝낼 수 있는지에서 나온다.',
    result: '시연 흐름이 짧아지고 설명이 쉬워졌다.',
    nextAction: '새 기능은 Lv1 플로우가 안정된 뒤 추가한다.',
    tags: ['실패', '범위조절', 'MVP']
  }
];

export function sampleRecordTemplates(): GrowthRecordInput[] {
  return samples.map(cloneRecordInput);
}

export function randomSampleRecord(): GrowthRecordInput {
  const sample = samples[Math.floor(Math.random() * samples.length)];
  return cloneRecordInput(sample);
}

function cloneRecordInput(record: GrowthRecordInput): GrowthRecordInput {
  return { ...record, tags: [...record.tags] };
}
