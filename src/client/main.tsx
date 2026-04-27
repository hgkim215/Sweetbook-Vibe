import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { BookOrder, ChapterSuggestion, GrowthCategory, GrowthRecord, OrderStatus } from '../shared/types';
import './styles.css';

const categories: Array<{ value: GrowthCategory; label: string }> = [
  { value: 'project', label: '프로젝트' },
  { value: 'learning', label: '학습' },
  { value: 'failure', label: '실패' },
  { value: 'improvement', label: '개선' },
  { value: 'reflection', label: '회고' },
  { value: 'impact', label: '성과' }
];

type OrderDetail = BookOrder & { records: GrowthRecord[] };

function App() {
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [orders, setOrders] = useState<BookOrder[]>([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [activeRecord, setActiveRecord] = useState<GrowthRecord | null>(null);
  const [activeOrder, setActiveOrder] = useState<OrderDetail | null>(null);
  const [chapters, setChapters] = useState<ChapterSuggestion[]>([]);
  const [assistantSource, setAssistantSource] = useState<'gemini' | 'mock' | null>(null);
  const [orderTitle, setOrderTitle] = useState('나의 성장기록집');
  const [authorName, setAuthorName] = useState('GrowthBook 사용자');
  const [requestMemo, setRequestMemo] = useState('시간순 흐름과 변화가 잘 보이게 구성해주세요.');
  const [message, setMessage] = useState('');
  const [sampleLoading, setSampleLoading] = useState(false);
  const [form, setForm] = useState(recordForm());

  useEffect(() => {
    void refresh();
  }, []);

  const selectedRecords = useMemo(
    () => records.filter((record) => selectedRecordIds.includes(record.id)),
    [records, selectedRecordIds]
  );

  async function refresh() {
    const [recordResponse, orderResponse] = await Promise.all([fetch('/api/records'), fetch('/api/orders')]);
    setRecords(await recordResponse.json());
    setOrders(await orderResponse.json());
  }

  async function saveRecord(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(activeRecord ? `/api/records/${activeRecord.id}` : '/api/records', {
      method: activeRecord ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tags: splitTags(form.tags) })
    });
    if (!response.ok) {
      setMessage((await response.json()).message);
      return;
    }
    setMessage(activeRecord ? '성장기록을 수정했습니다.' : '성장기록을 추가했습니다.');
    setActiveRecord(null);
    setForm(recordForm());
    await refresh();
  }

  async function deleteRecord(record: GrowthRecord) {
    const shouldDelete = window.confirm(`"${record.title}" 기록을 삭제할까요?`);
    if (!shouldDelete) return;

    const response = await fetch(`/api/records/${record.id}`, { method: 'DELETE' });
    if (!response.ok) {
      setMessage((await response.json()).message ?? '성장기록 삭제에 실패했습니다.');
      return;
    }

    setSelectedRecordIds((current) => current.filter((recordId) => recordId !== record.id));
    if (activeRecord?.id === record.id) {
      setActiveRecord(null);
      setForm(recordForm());
    }
    setMessage('성장기록을 삭제했습니다.');
    await refresh();
  }

  async function createSampleRecord() {
    setSampleLoading(true);
    setMessage('AI 예시 성장기록을 생성 중입니다.');
    try {
      const response = await fetch('/api/assist/sample-record', { method: 'POST' });
      const data = await response.json() as { source?: 'gemini' | 'mock'; record?: GrowthRecord; message?: string };
      if (!response.ok || !data.record || !data.source) {
        setMessage(data.message ?? 'AI 예시 성장기록 생성에 실패했습니다.');
        return;
      }
      setMessage(data.source === 'gemini' ? 'Gemini 예시 성장기록을 추가했습니다.' : 'Mock 예시 성장기록을 추가했습니다.');
      await refresh();
      editRecord(data.record);
    } catch {
      setMessage('AI 예시 성장기록 생성에 실패했습니다.');
    } finally {
      setSampleLoading(false);
    }
  }

  async function suggest() {
    const response = await fetch('/api/assist/chapter-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordIds: selectedRecordIds })
    });
    const data = await response.json() as { source: 'gemini' | 'mock'; chapters: ChapterSuggestion[] };
    setAssistantSource(data.source);
    setChapters(data.chapters);
    setMessage(data.source === 'gemini' ? 'Gemini 보조 정리자가 챕터를 제안했습니다.' : 'Mock 보조 정리자가 챕터를 제안했습니다.');
  }

  async function createOrder() {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: orderTitle,
        authorName,
        requestMemo,
        recordIds: selectedRecordIds,
        chapters
      })
    });
    if (!response.ok) {
      setMessage((await response.json()).message);
      return;
    }
    const order = await response.json() as BookOrder;
    setMessage('성장기록집 주문을 생성했습니다.');
    setSelectedRecordIds([]);
    setChapters([]);
    await refresh();
    await openOrder(order.id);
  }

  async function openOrder(id: string) {
    const response = await fetch(`/api/orders/${id}`);
    setActiveOrder(await response.json());
  }

  async function updateStatus(status: OrderStatus) {
    if (!activeOrder) return;
    await fetch(`/api/orders/${activeOrder.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    await openOrder(activeOrder.id);
    await refresh();
  }

  function editRecord(record: GrowthRecord) {
    setActiveRecord(record);
    setForm({
      title: record.title,
      category: record.category,
      recordDate: record.recordDate,
      summary: record.summary,
      body: record.body,
      lesson: record.lesson,
      result: record.result,
      nextAction: record.nextAction,
      tags: record.tags.join(', ')
    });
  }

  function startNewRecord() {
    setActiveRecord(null);
    setForm(recordForm());
  }

  return (
    <main className="appShell">
      <header className="appHeader">
        <div className="brandBlock">
          <p className="eyebrow">GrowthBook</p>
          <h1>성장기록 작업대</h1>
          <p>기록을 정리하고, 선택한 경험을 성장기록집 주문 데이터로 전환합니다.</p>
        </div>
        <div className="headerTools">
          <div className="metric">
            <strong>{records.length}</strong>
            <span>기록</span>
          </div>
          <div className="metric">
            <strong>{selectedRecords.length}</strong>
            <span>선택</span>
          </div>
          <div className="metric">
            <strong>{orders.length}</strong>
            <span>주문</span>
          </div>
          <button type="button" className="secondaryButton" onClick={startNewRecord}>새 기록</button>
        </div>
      </header>

      {message && <div className="notice" role="status">{message}</div>}

      <section className="workspaceGrid">
        <aside className="pane recordPane">
          <div className="paneHeader">
            <div>
              <h2>성장기록</h2>
              <p>편집할 기록과 책에 넣을 기록을 고릅니다.</p>
            </div>
            <span className="countBadge">{selectedRecords.length}개 선택</span>
          </div>
          <div className="recordToolbar">
            <button type="button" className="secondaryButton" onClick={createSampleRecord} disabled={sampleLoading}>
              {sampleLoading ? '생성 중' : 'AI 예시 기록 생성'}
            </button>
          </div>
          <div className="recordList">
            {records.map((record) => {
              const isSelected = selectedRecordIds.includes(record.id);
              const isActive = activeRecord?.id === record.id;
              return (
                <div key={record.id} className={`recordRow ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    aria-label={`${record.title} 책 포함 선택`}
                    checked={isSelected}
                    onChange={(event) => {
                      setSelectedRecordIds((current) =>
                        event.target.checked ? [...current, record.id] : current.filter((id) => id !== record.id)
                      );
                    }}
                  />
                  <button type="button" className="recordSelect" aria-label={`${record.title} 상세 수정 열기`} onClick={() => editRecord(record)}>
                    <span className="rowTitle">{record.title}</span>
                    <span className="rowMeta">{label(record.category)} · {record.recordDate}</span>
                    <span className="rowSummary">{record.summary}</span>
                  </button>
                  <div className="recordActions" aria-label={`${record.title} 관리`}>
                    <button type="button" className="tinyButton" onClick={() => editRecord(record)}>수정</button>
                    <button type="button" className="tinyButton dangerGhostButton" onClick={() => deleteRecord(record)}>삭제</button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="pane editorPane">
          <div className="paneHeader">
            <div>
              <h2>{activeRecord ? '성장기록 상세/수정' : '새 성장기록'}</h2>
              <p>문제, 행동, 배운 점, 결과를 한 번에 남깁니다.</p>
            </div>
            {activeRecord && (
              <button type="button" className="ghostButton" onClick={startNewRecord}>새 기록</button>
            )}
          </div>

          <form className="recordForm" onSubmit={saveRecord}>
            <Field label="제목" className="wide">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="예: Docker 실행 오류를 해결한 경험" />
            </Field>
            <div className="fieldGrid">
              <Field label="카테고리">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as GrowthCategory })}>
                  {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </Field>
              <Field label="기록일">
                <input type="date" value={form.recordDate} onChange={(e) => setForm({ ...form, recordDate: e.target.value })} />
              </Field>
            </div>
            <Field label="한 줄 요약" className="wide">
              <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="무엇을 해결했고 무엇이 달라졌는지 짧게 적습니다." />
            </Field>
            <Field label="상황과 내가 한 행동" className="wide">
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="문제 상황, 판단, 실행 과정을 적습니다." />
            </Field>
            <div className="fieldGrid">
              <Field label="배운 점">
                <textarea value={form.lesson} onChange={(e) => setForm({ ...form, lesson: e.target.value })} placeholder="다음에도 가져갈 원칙을 적습니다." />
              </Field>
              <Field label="결과">
                <textarea value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder="검증 결과나 변화한 지점을 적습니다." />
              </Field>
            </div>
            <Field label="다음 행동" className="wide">
              <input value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} placeholder="이어갈 개선이나 확인할 일을 적습니다." />
            </Field>
            <Field label="태그" className="wide">
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Docker, 검증, 문제해결" />
            </Field>
            <div className="actionBar">
              <button type="submit">{activeRecord ? '수정 저장' : '기록 추가'}</button>
              {activeRecord && <button type="button" className="dangerButton" onClick={() => deleteRecord(activeRecord)}>삭제</button>}
            </div>
          </form>
        </section>

        <aside className="pane orderPane">
          <div className="paneHeader">
            <div>
              <h2>성장기록집</h2>
              <p>선택한 기록을 챕터로 묶고 주문합니다.</p>
            </div>
            <StatusBadge source={assistantSource} />
          </div>

          <div className="selectionSummary">
            <span>선택 기록 <strong>{selectedRecords.length}</strong></span>
            <span>챕터 <strong>{chapters.length}</strong></span>
          </div>

          <div className="orderForm">
            <Field label="책 제목">
              <input value={orderTitle} onChange={(e) => setOrderTitle(e.target.value)} placeholder="나의 성장기록집" />
            </Field>
            <Field label="작성자명">
              <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="GrowthBook 사용자" />
            </Field>
            <Field label="요청사항">
              <textarea value={requestMemo} onChange={(e) => setRequestMemo(e.target.value)} placeholder="구성 방향이나 강조할 흐름을 적습니다." />
            </Field>
            <button type="button" className="secondaryButton" onClick={suggest} disabled={selectedRecordIds.length === 0}>챕터 제안</button>
            <button onClick={createOrder} disabled={selectedRecordIds.length === 0}>주문 생성</button>
          </div>

          <div className="chapterList">
            {chapters.length === 0 ? (
              <p className="emptyState">기록을 선택하고 챕터 제안을 실행하면 구성안이 표시됩니다.</p>
            ) : chapters.map((chapter, index) => (
              <article key={`${chapter.title}-${index}`} className="chapterItem">
                <input
                  aria-label={`${index + 1}번째 챕터 제목`}
                  value={chapter.title}
                  onChange={(e) => setChapters((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item))}
                />
                <p>{chapter.summary}</p>
                <small>{chapter.recordIds.length}개 기록 · 보완 질문 {chapter.missingQuestions.length}개</small>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="ordersBoard">
        <div className="pane ordersListPane">
          <div className="paneHeader">
            <div>
              <h2>주문 목록</h2>
              <p>생성된 성장기록집 주문을 확인합니다.</p>
            </div>
          </div>
          {orders.map((order) => (
            <button key={order.id} className={`orderRow ${activeOrder?.id === order.id ? 'active' : ''}`} onClick={() => openOrder(order.id)}>
              <span>
                <b>{order.title}</b>
                <small>{order.createdAt.slice(0, 10)}</small>
              </span>
              <em>{statusLabel(order.status)}</em>
            </button>
          ))}
        </div>
        <div className="pane orderDetailPane">
          <div className="paneHeader">
            <div>
              <h2>주문 상세</h2>
              <p>상태를 바꾸고 제출용 JSON을 내려받습니다.</p>
            </div>
          </div>
          {activeOrder ? (
            <div className="detailStack">
              <h3>{activeOrder.title}</h3>
              <p>{activeOrder.requestMemo}</p>
              <div className="statusButtons">
                {(['pending', 'processing', 'completed', 'cancelled'] as OrderStatus[]).map((status) => (
                  <button type="button" key={status} onClick={() => updateStatus(status)} className={activeOrder.status === status ? 'active' : ''}>{statusLabel(status)}</button>
                ))}
              </div>
              <a className="download" href={`/api/orders/${activeOrder.id}/export`}>JSON 다운로드</a>
              <p className="helper">포함 기록 {activeOrder.records.length}개 · 챕터 {activeOrder.chapters.length}개</p>
            </div>
          ) : (
            <p className="emptyState">주문을 선택하면 상태와 익스포트 버튼이 표시됩니다.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function recordForm() {
  return {
    title: '',
    category: 'project' as GrowthCategory,
    recordDate: new Date().toISOString().slice(0, 10),
    summary: '',
    body: '',
    lesson: '',
    result: '',
    nextAction: '',
    tags: ''
  };
}

function splitTags(tags: string) {
  return tags.split(',').map((tag) => tag.trim()).filter(Boolean);
}

function label(category: GrowthCategory) {
  return categories.find((item) => item.value === category)?.label ?? category;
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

function Field({ label: fieldLabel, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`field ${className}`}>
      <span>{fieldLabel}</span>
      {children}
    </label>
  );
}

function StatusBadge({ source }: { source: 'gemini' | 'mock' | null }) {
  if (!source) return <span className="statusBadge idle">대기</span>;
  return <span className={`statusBadge ${source}`}>{source === 'gemini' ? 'Gemini' : 'Mock'}</span>;
}

createRoot(document.getElementById('root')!).render(<App />);
