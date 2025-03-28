import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { ollamaApi } from './ollama';
import { ChatMessage } from '../types';

vi.mock('axios');

describe('ollamaApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listModels', () => {
    it('should fetch and format models correctly', async () => {
      const mockResponse = {
        data: {
          models: [
            { name: 'model1', modified_at: '2024-01-01', size: 1000 },
            { name: 'model2', modified_at: '2024-01-02', size: 2000 },
          ],
        },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await ollamaApi.listModels();

      expect(axios.get).toHaveBeenCalledWith('http://localhost:11434/api/tags');
      expect(result).toEqual([
        { name: 'model1' },
        { name: 'model2' },
      ]);
    });

    it('should handle errors when fetching models', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('Network error'));

      await expect(ollamaApi.listModels()).rejects.toThrow('Network error');
    });
  });

  describe('generateResponse', () => {
    it('should generate chat response correctly', async () => {
      const mockMessages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ];

      const mockResponse = {
        data: {
          message: {
            role: 'assistant' as const,
            content: 'Hello, how can I help you?',
          },
          done: true,
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await ollamaApi.generateResponse('test-model', mockMessages);

      expect(axios.post).toHaveBeenCalledWith('http://localhost:11434/api/chat', {
        model: 'test-model',
        messages: mockMessages,
        stream: false,
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when generating response', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Model not found'));

      await expect(ollamaApi.generateResponse('test-model', [])).rejects.toThrow('Model not found');
    });
  });

  describe('generateEmbedding', () => {
    it('should generate embedding correctly', async () => {
      const mockResponse = {
        data: {
          embedding: [0.1, 0.2, 0.3],
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await ollamaApi.generateEmbedding('test text', 'test-model');

      expect(axios.post).toHaveBeenCalledWith('http://localhost:11434/api/embeddings', {
        model: 'test-model',
        prompt: 'test text',
      });
      expect(result).toEqual([0.1, 0.2, 0.3]);
    });

    it('should handle errors when generating embedding', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Invalid model'));

      await expect(ollamaApi.generateEmbedding('test', 'test-model')).rejects.toThrow('Invalid model');
    });
  });
}); 