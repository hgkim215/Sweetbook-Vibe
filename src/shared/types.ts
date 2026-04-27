export type GrowthCategory = 'project' | 'learning' | 'failure' | 'improvement' | 'reflection' | 'impact';

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export type GrowthRecord = {
  id: string;
  title: string;
  category: GrowthCategory;
  recordDate: string;
  summary: string;
  body: string;
  lesson: string;
  result: string;
  nextAction: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type ChapterSuggestion = {
  title: string;
  summary: string;
  recordIds: string[];
  missingQuestions: string[];
};

export type BookOrder = {
  id: string;
  title: string;
  authorName: string;
  requestMemo: string;
  status: OrderStatus;
  recordIds: string[];
  chapters: ChapterSuggestion[];
  createdAt: string;
  updatedAt: string;
};

export type ExportPayload = {
  order: BookOrder;
  records: GrowthRecord[];
  metadata: {
    exportedAt: string;
    formatVersion: '1.0';
    partner: 'sweetbook-mock';
    service: 'GrowthBook';
    contentType: 'growth-record-book';
  };
};

