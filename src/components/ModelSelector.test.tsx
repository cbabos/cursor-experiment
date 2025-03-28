import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModelSelector } from './ModelSelector';
import { useAgent } from '../context/AgentContext';
import { QueryClient, QueryClientProvider, UseQueryResult } from '@tanstack/react-query';
import * as reactQuery from '@tanstack/react-query';
import { Model } from '../types';

vi.mock('../context/AgentContext', () => ({
  useAgent: vi.fn(),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

describe('ModelSelector', () => {
  const queryClient = new QueryClient();

  it('shows loading state initially', () => {
    const useAgentMock = vi.mocked(useAgent);
    useAgentMock.mockReturnValue({
      selectedModel: null,
      setSelectedModel: vi.fn(),
      memory: { shortTerm: [], longTerm: { embeddings: [], storage: [] } },
      tools: [],
      addToShortTermMemory: vi.fn(),
      addToLongTermMemory: vi.fn(),
      searchMemory: vi.fn(),
      executeTool: vi.fn(),
    });

    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
    } as UseQueryResult<Model[]>);

    render(
      <QueryClientProvider client={queryClient}>
        <ModelSelector />
      </QueryClientProvider>
    );

    expect(screen.getByText('Loading models...')).toBeInTheDocument();
  });

  it('displays available models', async () => {
    const useAgentMock = vi.mocked(useAgent);
    useAgentMock.mockReturnValue({
      selectedModel: null,
      setSelectedModel: vi.fn(),
      memory: { shortTerm: [], longTerm: { embeddings: [], storage: [] } },
      tools: [],
      addToShortTermMemory: vi.fn(),
      addToLongTermMemory: vi.fn(),
      searchMemory: vi.fn(),
      executeTool: vi.fn(),
    });

    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: [{ name: 'model1' }, { name: 'model2' }],
      isLoading: false,
      error: null,
      isError: false,
    } as UseQueryResult<Model[]>);

    render(
      <QueryClientProvider client={queryClient}>
        <ModelSelector />
      </QueryClientProvider>
    );

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);

    await waitFor(() => {
      expect(screen.getByText('model1')).toBeInTheDocument();
      expect(screen.getByText('model2')).toBeInTheDocument();
    });
  });

  it('handles model selection', async () => {
    const setSelectedModel = vi.fn();
    const useAgentMock = vi.mocked(useAgent);
    useAgentMock.mockReturnValue({
      selectedModel: null,
      setSelectedModel,
      memory: { shortTerm: [], longTerm: { embeddings: [], storage: [] } },
      tools: [],
      addToShortTermMemory: vi.fn(),
      addToLongTermMemory: vi.fn(),
      searchMemory: vi.fn(),
      executeTool: vi.fn(),
    });

    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: [{ name: 'model1' }, { name: 'model2' }],
      isLoading: false,
      error: null,
      isError: false,
    } as UseQueryResult<Model[]>);

    render(
      <QueryClientProvider client={queryClient}>
        <ModelSelector />
      </QueryClientProvider>
    );

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);

    await waitFor(() => {
      const option = screen.getByText('model1');
      fireEvent.click(option);
      expect(setSelectedModel).toHaveBeenCalledWith({ name: 'model1' });
    });

    useAgentMock.mockRestore();
  });
}); 