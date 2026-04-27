const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

async function main() {
  const records = await request('/api/records');
  assert(Array.isArray(records) && records.length >= 2, '더미 성장기록이 2개 이상 필요합니다.');

  const created = await request('/api/records', {
    method: 'POST',
    body: {
      title: 'Smoke Test 성장기록',
      category: 'learning',
      recordDate: '2026-04-28',
      summary: '전체 검증용 성장기록입니다.',
      body: 'Docker smoke test에서 생성한 기록입니다.',
      lesson: '검증은 사용자 플로우를 따라가야 합니다.',
      result: 'API 흐름 검증 범위를 넓혔습니다.',
      nextAction: '검증 실패 시 원인을 좁힙니다.',
      tags: ['smoke']
    },
    expectedStatus: 201
  });

  await request(`/api/records/${created.id}`, {
    method: 'PUT',
    body: { title: 'Smoke Test 수정 성장기록' }
  });

  await request(`/api/records/${created.id}`, {
    method: 'DELETE',
    expectedStatus: 204,
    parseJson: false
  });

  const recordIds = records.slice(0, 2).map((record) => record.id);
  const suggestions = await request('/api/assist/chapter-suggestions', {
    method: 'POST',
    body: { recordIds }
  });
  assert(['openai', 'mock'].includes(suggestions.source), '챕터 제안 source가 올바르지 않습니다.');
  assert(Array.isArray(suggestions.chapters) && suggestions.chapters.length > 0, '챕터 제안이 비어 있습니다.');

  const invalidIds = suggestions.chapters
    .flatMap((chapter) => chapter.recordIds ?? [])
    .filter((id) => !recordIds.includes(id));
  assert(invalidIds.length === 0, '챕터 제안에 요청하지 않은 성장기록 ID가 포함됐습니다.');

  const order = await request('/api/orders', {
    method: 'POST',
    expectedStatus: 201,
    body: {
      title: 'Smoke Test 성장기록집',
      authorName: 'GrowthBook',
      requestMemo: '전체 검증용 주문입니다.',
      recordIds,
      chapters: suggestions.chapters
    }
  });

  const processing = await request(`/api/orders/${order.id}/status`, {
    method: 'PATCH',
    body: { status: 'processing' }
  });
  assert(processing.status === 'processing', '주문 상태가 processing으로 바뀌지 않았습니다.');

  const completed = await request(`/api/orders/${order.id}/status`, {
    method: 'PATCH',
    body: { status: 'completed' }
  });
  assert(completed.status === 'completed', '주문 상태가 completed로 바뀌지 않았습니다.');

  const exported = await request(`/api/orders/${order.id}/export`);
  assert(exported.metadata?.service === 'GrowthBook', '익스포트 메타데이터가 올바르지 않습니다.');
  assert(exported.records?.length === recordIds.length, '익스포트 성장기록 개수가 올바르지 않습니다.');

  console.log(`[smoke-api-flow] Passed: ${baseUrl}`);
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const expectedStatus = options.expectedStatus ?? 200;
  if (response.status !== expectedStatus) {
    const text = await response.text();
    throw new Error(`${path} expected ${expectedStatus}, got ${response.status}: ${text}`);
  }

  if (options.parseJson === false || response.status === 204) return null;
  return response.json();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error('[smoke-api-flow] Failed');
  console.error(error);
  process.exit(1);
});
