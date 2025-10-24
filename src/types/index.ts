// Common types used across the application

export interface TabResults {
  results: any[];
  columns: string[];
  rowCount: number;
  executionError: string | null;
  executionMetadata: any;
  selectedRowIndex: number | null;
  chartConfig: any;
}

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

export interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

export interface Tab {
  id: string;
  name: string;
  queryText: string;
  results: TabResults;
}
