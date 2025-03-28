import axios from 'axios';
import { Model } from '../types';

const OLLAMA_BASE_URL = 'http://localhost:11434';

interface OllamaTagsResponse {
  models: Array<{
    name: string;
    modified_at: string;
    size: number;
  }>;
}

interface EmbeddingResponse {
  embedding: number[];
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatResponse {
  message: {
    role: 'assistant';
    content: string;
  };
  done: boolean;
}

export const ollamaApi = {
  async listModels(): Promise<Model[]> {
    const response = await axios.get<OllamaTagsResponse>(`${OLLAMA_BASE_URL}/api/tags`);
    return response.data.models.map(model => ({
      name: model.name
    }));
  },

  async generateResponse(model: string, messages: ChatMessage[]): Promise<ChatResponse> {
    const response = await axios.post<ChatResponse>(`${OLLAMA_BASE_URL}/api/chat`, {
      model,
      messages,
      stream: false,
    });
    return response.data;
  },

  async generateEmbedding(text: string, model: string): Promise<number[]> {
    const response = await axios.post<EmbeddingResponse>(`${OLLAMA_BASE_URL}/api/embeddings`, {
      model,
      prompt: text,
    });
    return response.data.embedding;
  }
}; 