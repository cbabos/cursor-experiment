import { describe, it, expect, vi } from 'vitest';
import { MemoryService } from './MemoryService';
import { ollamaApi } from '../api/ollama';
import { Message } from '../types';

vi.mock('../api/ollama', () => ({
  ollamaApi: {
    generateEmbedding: vi.fn(),
  },
}));

describe('MemoryService', () => {
  describe('addToLongTermMemory', () => {
    it('should generate embedding for a message and return it with the message', async () => {
      const message: Message = {
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      };
      const mockEmbedding = [0.1, 0.2, 0.3];
      vi.mocked(ollamaApi.generateEmbedding).mockResolvedValue(mockEmbedding);

      const result = await MemoryService.addToLongTermMemory(message, 'test-model');

      expect(ollamaApi.generateEmbedding).toHaveBeenCalledWith(message.content, 'test-model');
      expect(result).toEqual({
        embedding: mockEmbedding,
        message,
      });
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate cosine similarity between two vectors', () => {
      const a = [1, 0];
      const b = [1, 0];
      const c = [0, 1];

      // Same vectors should have similarity 1
      expect(MemoryService.cosineSimilarity(a, b)).toBe(1);
      // Orthogonal vectors should have similarity 0
      expect(MemoryService.cosineSimilarity(a, c)).toBe(0);
      // Vector with itself should have similarity 1
      expect(MemoryService.cosineSimilarity(a, a)).toBe(1);
    });

    it('should handle zero vectors', () => {
      const zero = [0, 0];
      const nonZero = [1, 1];

      // Zero vectors should return 0 similarity
      expect(MemoryService.cosineSimilarity(zero, nonZero)).toBe(0);
      expect(MemoryService.cosineSimilarity(nonZero, zero)).toBe(0);
      expect(MemoryService.cosineSimilarity(zero, zero)).toBe(0);
    });
  });

  describe('searchSimilarMemories', () => {
    it('should find and sort similar memories above threshold', async () => {
      const query = 'test query';
      const queryEmbedding = [1, 0];
      const memories = [
        { embedding: [1, 0], message: { role: 'user' as const, content: 'similar1', timestamp: 1 } },
        { embedding: [0.7, 0.7], message: { role: 'user' as const, content: 'similar2', timestamp: 2 } },
        { embedding: [0, 1], message: { role: 'user' as const, content: 'different', timestamp: 3 } },
      ];

      vi.mocked(ollamaApi.generateEmbedding).mockResolvedValue(queryEmbedding);

      const results = await MemoryService.searchSimilarMemories(query, 'test-model', memories);

      expect(ollamaApi.generateEmbedding).toHaveBeenCalledWith(query, 'test-model');
      expect(results).toHaveLength(1); // Only the first memory should be above threshold (0.8)
      expect(results[0].message.content).toBe('similar1');
      expect(results[0].similarity).toBe(1);
    });

    it('should return empty array when no memories are similar enough', async () => {
      const query = 'test query';
      const queryEmbedding = [1, 0];
      const memories = [
        { embedding: [0, 1], message: { role: 'user' as const, content: 'different', timestamp: 1 } },
      ];

      vi.mocked(ollamaApi.generateEmbedding).mockResolvedValue(queryEmbedding);

      const results = await MemoryService.searchSimilarMemories(query, 'test-model', memories);

      expect(results).toHaveLength(0);
    });
  });

  describe('pruneShortTermMemory', () => {
    it('should keep only the most recent messages up to the limit', () => {
      const messages: Message[] = Array.from({ length: 15 }, (_, i) => ({
        role: 'user',
        content: `message ${i}`,
        timestamp: i,
      }));

      const pruned = MemoryService.pruneShortTermMemory(messages);

      expect(pruned).toHaveLength(10); // MAX_SHORT_TERM_MESSAGES = 10
      expect(pruned[0].content).toBe('message 5'); // Should start from index 5
      expect(pruned[9].content).toBe('message 14'); // Should end with the last message
    });

    it('should return all messages if count is below limit', () => {
      const messages: Message[] = Array.from({ length: 5 }, (_, i) => ({
        role: 'user',
        content: `message ${i}`,
        timestamp: i,
      }));

      const pruned = MemoryService.pruneShortTermMemory(messages);

      expect(pruned).toHaveLength(5);
      expect(pruned).toEqual(messages);
    });
  });
}); 