export interface Model {
  name: string;
  parameters?: Record<string, any>;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Memory {
  shortTerm: Message[];
  longTerm: {
    embeddings: any[];
    storage: Message[];
  };
}

export interface Tool {
  name: string;
  description: string;
  execute: (args: any) => Promise<any>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
} 