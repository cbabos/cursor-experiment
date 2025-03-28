import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Chat } from './Chat';
import { AgentProvider } from '../context/AgentContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ollamaApi } from '../api/ollama';
import * as AgentContextModule from '../context/AgentContext';
import type { ReactNode } from 'react';

vi.mock('../api/ollama', () => ({
  ollamaApi: {
    generateResponse: vi.fn(),
    listModels: vi.fn(),
  },
}));

describe('Chat', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.resetModules();
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AgentProvider>
        {children}
      </AgentProvider>
    </QueryClientProvider>
  );

  it('renders chat interface', () => {
    render(<Chat />, { wrapper: Wrapper });
    
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('disables input when no model is selected', () => {
    render(<Chat />, { wrapper: Wrapper });
    
    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });

  it('displays messages in chat log', async () => {
    const addToShortTermMemory = vi.fn();
    const mockUseAgent = vi.spyOn(AgentContextModule, 'useAgent');
    mockUseAgent.mockReturnValue({
      selectedModel: { name: 'test-model' },
      memory: { 
        shortTerm: [{ role: 'user', content: 'Hello', timestamp: Date.now() }],
        longTerm: { embeddings: [], storage: [] }
      },
      tools: [],
      addToShortTermMemory,
      addToLongTermMemory: vi.fn(),
      searchMemory: vi.fn(),
      executeTool: vi.fn(),
      setSelectedModel: vi.fn(),
    });

    (ollamaApi.generateResponse as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      message: { role: 'assistant', content: 'Test response' }
    });

    render(<Chat />, { wrapper: Wrapper });
    
    expect(screen.getByText('Hello')).toBeInTheDocument();

    mockUseAgent.mockRestore();
  });

  it('handles message submission', async () => {
    const addToShortTermMemory = vi.fn();
    const mockUseAgent = vi.spyOn(AgentContextModule, 'useAgent');
    mockUseAgent.mockReturnValue({
      selectedModel: { name: 'test-model' },
      memory: { shortTerm: [], longTerm: { embeddings: [], storage: [] } },
      tools: [],
      addToShortTermMemory,
      addToLongTermMemory: vi.fn(),
      searchMemory: vi.fn(),
      executeTool: vi.fn(),
      setSelectedModel: vi.fn(),
    });

    render(<Chat />, { wrapper: Wrapper });
    
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    
    const form = screen.getByRole('form');
    await fireEvent.submit(form);
    
    await waitFor(() => {
      expect(addToShortTermMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          content: 'Test message',
        })
      );
    });

    mockUseAgent.mockRestore();
  });
}); 