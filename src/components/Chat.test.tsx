import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { Chat } from './Chat';
import { AgentProvider } from '../context/AgentContext';
import { QueryClient, QueryClientProvider, UseQueryResult } from '@tanstack/react-query';
import { ollamaApi } from '../api/ollama';
import * as AgentContextModule from '../context/AgentContext';
import * as reactQuery from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Model } from '../types';

vi.mock('../api/ollama', () => ({
  ollamaApi: {
    generateResponse: vi.fn(),
    listModels: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

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
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: [{ name: 'model1' }],
      isLoading: false,
      error: null,
      isError: false,
    } as UseQueryResult<Model[]>);

    render(<Chat />, { wrapper: Wrapper });
    
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('disables input when no model is selected', () => {
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: [{ name: 'model1' }],
      isLoading: false,
      error: null,
      isError: false,
    } as UseQueryResult<Model[]>);

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

    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: [{ name: 'test-model' }],
      isLoading: false,
      error: null,
      isError: false,
    } as UseQueryResult<Model[]>);

    (ollamaApi.generateResponse as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      message: { role: 'assistant', content: 'Test response' }
    });

    render(<Chat />, { wrapper: Wrapper });
    
    expect(screen.getByText('Hello')).toBeInTheDocument();

    mockUseAgent.mockRestore();
  });

  it('handles message submission', async () => {
    const addToShortTermMemory = vi.fn();
    const addToLongTermMemory = vi.fn();
    const searchMemory = vi.fn().mockResolvedValue([]);
    const executeTool = vi.fn();
    const mockUseAgent = vi.spyOn(AgentContextModule, 'useAgent');
    mockUseAgent.mockReturnValue({
      selectedModel: { name: 'test-model' },
      memory: { shortTerm: [], longTerm: { embeddings: [], storage: [] } },
      tools: [],
      addToShortTermMemory,
      addToLongTermMemory,
      searchMemory,
      executeTool,
      setSelectedModel: vi.fn(),
    });

    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: [{ name: 'test-model' }],
      isLoading: false,
      error: null,
      isError: false,
    } as UseQueryResult<Model[]>);

    (ollamaApi.generateResponse as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      message: { role: 'assistant', content: 'Test response' }
    });

    render(<Chat />, { wrapper: Wrapper });
    
    const input = screen.getByPlaceholderText('Type your message...');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test message' } });
      const form = screen.getByRole('form');
      await fireEvent.submit(form);
    });
    
    await waitFor(() => {
      expect(addToShortTermMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          content: 'Test message',
        })
      );
      expect(addToLongTermMemory).toHaveBeenCalled();
      expect(searchMemory).toHaveBeenCalledWith('Test message');
      expect(ollamaApi.generateResponse).toHaveBeenCalled();
    });

    mockUseAgent.mockRestore();
  });

  it('handles tool execution in messages', async () => {
    const addToShortTermMemory = vi.fn();
    const addToLongTermMemory = vi.fn().mockResolvedValue(undefined);
    const searchMemory = vi.fn().mockResolvedValue([]);
    const executeTool = vi.fn().mockResolvedValue('Tool result');
    const mockUseAgent = vi.spyOn(AgentContextModule, 'useAgent');
    mockUseAgent.mockReturnValue({
      selectedModel: { name: 'test-model' },
      memory: { shortTerm: [], longTerm: { embeddings: [], storage: [] } },
      tools: [{ name: 'weather', description: 'Get weather', execute: vi.fn() }],
      addToShortTermMemory,
      addToLongTermMemory,
      searchMemory,
      executeTool,
      setSelectedModel: vi.fn(),
    });

    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: [{ name: 'test-model' }],
      isLoading: false,
      error: null,
      isError: false,
    } as UseQueryResult<Model[]>);

    const mockResponse = {
      message: { 
        role: 'assistant', 
        content: '/tool:weather{location: London}' 
      }
    };

    const generateResponseMock = vi.fn().mockResolvedValue(mockResponse);
    (ollamaApi.generateResponse as unknown) = generateResponseMock;

    render(<Chat />, { wrapper: Wrapper });
    
    const input = screen.getByPlaceholderText('Type your message...');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'What is the weather?' } });
      const form = screen.getByRole('form');
      await fireEvent.submit(form);

      // Wait for all promises to resolve
      await Promise.resolve();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Wait for the API response and tool execution
    await waitFor(() => {
      expect(generateResponseMock).toHaveBeenCalled();
      console.log('API response:', generateResponseMock.mock.results[0]?.value);
    }, { timeout: 2000 });
    
    await waitFor(() => {
      console.log('executeTool calls:', executeTool.mock.calls);
      expect(executeTool).toHaveBeenCalledWith('weather', { location: 'London' });
    }, { timeout: 2000 });

    await waitFor(() => {
      console.log('addToShortTermMemory calls:', addToShortTermMemory.mock.calls);
      expect(addToShortTermMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'assistant',
          content: expect.stringContaining('[weather result: Tool result]'),
        })
      );
    }, { timeout: 2000 });

    mockUseAgent.mockRestore();
  });

  it('handles errors during message submission', async () => {
    const addToShortTermMemory = vi.fn();
    const mockUseAgent = vi.spyOn(AgentContextModule, 'useAgent');
    mockUseAgent.mockReturnValue({
      selectedModel: { name: 'test-model' },
      memory: { shortTerm: [], longTerm: { embeddings: [], storage: [] } },
      tools: [],
      addToShortTermMemory,
      addToLongTermMemory: vi.fn(),
      searchMemory: vi.fn().mockRejectedValue(new Error('Search failed')),
      executeTool: vi.fn(),
      setSelectedModel: vi.fn(),
    });

    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: [{ name: 'test-model' }],
      isLoading: false,
      error: null,
      isError: false,
    } as UseQueryResult<Model[]>);

    render(<Chat />, { wrapper: Wrapper });
    
    const input = screen.getByPlaceholderText('Type your message...');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test message' } });
      const form = screen.getByRole('form');
      await fireEvent.submit(form);
    });
    
    await waitFor(() => {
      expect(addToShortTermMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'assistant',
          content: 'Sorry, an error occurred while processing your request.',
        })
      );
    });

    mockUseAgent.mockRestore();
  });
}); 