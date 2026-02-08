export interface ChatMessage {
  id: number;
  content: string;
  role: string;
  created_at: string;
  room_id: number;
  isStreaming?: boolean;
  file?: {
    type: string;
    data: string;
    name: string;
  };
  citations?: Array<{
    url: string;
  }>;
  updated_at?: string;
}

export interface StreamingMessage extends ChatMessage {
  isStreaming?: boolean;
  files?: Array<{
    type: string;
    data: string;
    name: string;
  }>;
  citations?: Array<{
    url: string;
    title?: string;
  }>;
  reasoningContent?: string;
  thoughtTime?: number;
  showReasoning?: boolean;
  functionCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
    result?: any;
  }>;
  codeExecutions?: Array<{
    code: string;
    result: string;
    language: string;
  }>;
  groundingMetadata?: {
    searchQueries?: string[];
    sources?: Array<{ url: string; title: string }>;
  };
  created_at: string;
  updated_at: string;
}

export {}; // 파일을 모듈로 만들기 위한 빈 export
