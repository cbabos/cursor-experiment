import { Message } from '../types';
import { ollamaApi } from '../api/ollama';

export class MemoryService {
  private static readonly MAX_SHORT_TERM_MESSAGES = 10;
  private static readonly SIMILARITY_THRESHOLD = 0.8;

  static async addToLongTermMemory(
    message: Message,
    modelName: string,
    existingEmbeddings: Array<{ embedding: number[]; message: Message }>
  ) {
    const embedding = await ollamaApi.generateEmbedding(message.content, modelName);
    return { embedding, message };
  }

  static cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  static async searchSimilarMemories(
    query: string,
    modelName: string,
    memories: Array<{ embedding: number[]; message: Message }>
  ) {
    const queryEmbedding = await ollamaApi.generateEmbedding(query, modelName);
    
    return memories
      .map(memory => ({
        ...memory,
        similarity: this.cosineSimilarity(queryEmbedding, memory.embedding),
      }))
      .filter(memory => memory.similarity >= this.SIMILARITY_THRESHOLD)
      .sort((a, b) => b.similarity - a.similarity);
  }

  static pruneShortTermMemory(messages: Message[]): Message[] {
    return messages.slice(-this.MAX_SHORT_TERM_MESSAGES);
  }
} 