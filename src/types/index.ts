/**
 * Typ-Definitionen für das Scheidungsrecht-RAG-System
 */

export interface Urteil {
  id: string;
  signatur: string;
  title: string;
  date: string;
  court: string;
  tags?: string[];
  chunks_count?: number;
  file_path?: string;
  summary?: string;
}

export interface Chunk {
  id: string;
  signatur: string;
  chunk_index: number;
  text: string;
  metadata?: Record<string, any>;
}

export interface ChunksBySignatur {
  signatur: string;
  chunks: Chunk[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp?: number;
}

export interface Source {
  signatur: string;
  date: string;
  relevanceScore?: number;
}

export interface FilterOptions {
  searchQuery: string;
  selectedTags: string[];
  dateRange: {
    from: string;
    to: string;
  };
  selectedGericht: string;
}

export interface Statistics {
  totalUrteile: number;
  totalChunks: number;
  dateRange: {
    earliest?: string;
    latest?: string;
  };
  tags?: Record<string, number>;
  courtDistribution?: Record<string, number>;
}

export interface RAGSearchResult {
  urteil: Urteil;
  relevanceScore: number;
  matchedChunks?: Chunk[];
}

export interface ClaudeAPIRequest {
  model: string;
  max_tokens: number;
  system?: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
}

export interface ClaudeAPIResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export type TabType = 'search' | 'chat' | 'upload' | 'stats';

export interface AppState {
  activeTab: TabType;
  urteile: Urteil[];
  indexData: Urteil[];
  messages: Message[];
  currentMessage: string;
  isProcessing: boolean;
  selectedUrteil: Urteil | null;
  filterOptions: FilterOptions;
  stats: Statistics;
}
