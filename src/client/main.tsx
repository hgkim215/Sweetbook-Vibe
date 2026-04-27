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
  const [assistantSource, setAssistantSource] = useState<'openai' | 'mock' | null>(null);
  const [orderTitle, setOrderTitle] = useState('나의 성장기록집');
  const [authorName, setAuthorName] = useState('GrowthBook 사용자');
  const [requestMemo, setRequestMemo] = useState('시간순 흐름과 변화가 잘 보이게 구성해주세요.');
  const [message, setMessage] = useState('');
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

  async function deleteRecord(id: string) {
    await fetch(`/api/records/${id}`, { method: 'DELETE' });
    setSelectedRecordIds((current) => current.filter((recordId) => recordId !== id));
    await refresh();
  }

  async function suggest() {
    const response = await fetch('/api/assist/chapter-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordIds: selectedRecordIds })
    });
    const data = await response.json() as { source: 'openai' | 'mock'; chapters: ChapterSuggestion[] };
    setAssistantSource(data.source);
    setChapters(data.chapters);
    setMessage(data.source === 'openai' ? 'OpenAI 보조 정리자가 챕터를 제안했습니다.' : 'Mock 보조 정리자가 챕터를 제안했습니다.');
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

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">GrowthBook</p>
          <h1>흩어진 성장 기록을 한 권의 성장기록집으로</h1>
          <p className="lead">프로젝트, 학습, 실패, 개선의 흔적을 정리하고 선택한 기록을 책 주문 데이터로 내보냅니다.</p>
        </div>
        <div className="heroPanel">
          <strong>{records.length}</strong>
          <span>성장기록</span>
          <strong>{orders.length}</strong>
          <span>성장기록집 주문</span>
        </div>
      </section>

      {message && <div className="notice">{message}</div>}

      <section className="workspace">
        <aside className="sidebar">
          <h2>성장기록</h2>
          <p>책에 포함할 기록을 선택하세요.</p>
          <div className="recordList">
            {records.map((record) => (
              <button key={record.id} className="recordRow" onClick={() => setActiveRecord(record)}>
                <input
                  type="checkbox"
                  checked={selectedRecordIds.includes(record.id)}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    setSelectedRecordIds((current) =>
                      event.target.checked ? [...current, record.id] : current.filter((id) => id !== record.id)
                    );
                  }}
                />
                <span>
                  <b>{record.title}</b>
                  <small>{label(record.category)} · {record.recordDate}</small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="content">
          <div className="sectionHeader">
            <div>
              <h2>{activeRecord ? '성장기록 상세/수정' : '새 성장기록'}</h2>
              <p>문제, 행동, 배운 점, 결과를 한 번에 남깁니다.</p>
            </div>
            {activeRecord && (
              <button className="ghost" onClick={() => { setActiveRecord(null); setForm(recordForm()); }}>새 기록</button>
            )}
          </div>

          <form className="recordForm" onSubmit={saveRecord}>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="제목" />
            <div className="grid2">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as GrowthCategory })}>
                {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <input type="date" value={form.recordDate} onChange={(e) => setForm({ ...form, recordDate: e.target.value })} />
            </div>
            <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="한 줄 요약" />
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="상황과 내가 한 행동" />
            <div className="grid2">
              <textarea value={form.lesson} onChange={(e) => setForm({ ...form, lesson: e.target.value })} placeholder="배운 점" />
              <textarea value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder="결과" />
            </div>
            <input value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} placeholder="다음 행동" />
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="태그: 쉼표로 구분" />
            <div className="actions">
              <button type="submit">{activeRecord ? '수정 저장' : '기록 추가'}</button>
              {activeRecord && <button type="button" className="danger" onClick={() => deleteRecord(activeRecord.id)}>삭제</button>}
            </div>
          </form>
        </section>
      </section>

      <section className="orderArea">
        <div className="sectionHeader">
          <div>
            <h2>성장기록집 주문</h2>
            <p>선택한 {selectedRecords.length}개 기록을 챕터로 묶고 주문 상태를 관리합니다.</p>
          </div>
          <button onClick={suggest} disabled={selectedRecordIds.length === 0}>챕터 제안</button>
        </div>

        <div className="orderGrid">
          <div>
            <input value={orderTitle} onChange={(e) => setOrderTitle(e.target.value)} placeholder="책 제목" />
            <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="작성자명" />
            <textarea value={requestMemo} onChange={(e) => setRequestMemo(e.target.value)} placeholder="요청사항" />
            <button onClick={createOrder} disabled={selectedRecordIds.length === 0}>주문 생성</button>
            {assistantSource && <p className="helper">보조 정리자: {assistantSource === 'openai' ? 'OpenAI' : 'Mock fallback'}</p>}
          </div>
          <div className="chapterList">
            {chapters.map((chapter, index) => (
              <article key={`${chapter.title}-${index}`}>
                <input
                  value={chapter.title}
                  onChange={(e) => setChapters((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item))}
                />
                <p>{chapter.summary}</p>
                <small>{chapter.recordIds.length}개 기록 · 질문 {chapter.missingQuestions.length}개</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="orders">
        <div>
          <h2>주문 목록</h2>
          {orders.map((order) => (
            <button key={order.id} className="orderRow" onClick={() => openOrder(order.id)}>
              <b>{order.title}</b>
              <span>{order.status}</span>
            </button>
          ))}
        </div>
        <div className="orderDetail">
          <h2>주문 상세</h2>
          {activeOrder ? (
            <>
              <h3>{activeOrder.title}</h3>
              <p>{activeOrder.requestMemo}</p>
              <div className="statusButtons">
                {(['pending', 'processing', 'completed', 'cancelled'] as OrderStatus[]).map((status) => (
                  <button key={status} onClick={() => updateStatus(status)} className={activeOrder.status === status ? 'active' : ''}>{status}</button>
                ))}
              </div>
              <a className="download" href={`/api/orders/${activeOrder.id}/export`}>JSON 다운로드</a>
              <p className="helper">포함 기록 {activeOrder.records.length}개 · 챕터 {activeOrder.chapters.length}개</p>
            </>
          ) : (
            <p>주문을 선택하면 상세와 익스포트 버튼이 표시됩니다.</p>
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

createRoot(document.getElementById('root')!).render(<App />);

