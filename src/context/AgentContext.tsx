import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Memory, Model, Tool, Message } from '../types';
import { MemoryService } from '../services/MemoryService';
import { ToolService } from '../services/ToolService';
import { weatherTool, calculatorTool, searchTool } from '../tools';

interface AgentContextType {
  selectedModel: Model | null;
  memory: Memory;
  tools: Tool[];
  setSelectedModel: (model: Model) => void;
  addToShortTermMemory: (message: Message) => void;
  addToLongTermMemory: (message: Message) => Promise<void>;
  searchMemory: (query: string) => Promise<Message[]>;
  executeTool: (name: string, args: any) => Promise<any>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [memory, setMemory] = useState<Memory>({
    shortTerm: [],
    longTerm: {
      embeddings: [],
      storage: [],
    },
  });
  const [toolService] = useState(() => {
    const service = new ToolService();
    service.registerTool(weatherTool);
    service.registerTool(calculatorTool);
    service.registerTool(searchTool);
    return service;
  });

  const addToShortTermMemory = (message: Message) => {
    setMemory(prev => ({
      ...prev,
      shortTerm: MemoryService.pruneShortTermMemory([...prev.shortTerm, message]),
    }));
  };

  const addToLongTermMemory = async (message: Message) => {
    if (!selectedModel) return;

    const memoryWithEmbedding = await MemoryService.addToLongTermMemory(
      message,
      selectedModel.name,
      memory.longTerm.embeddings
    );

    setMemory(prev => ({
      ...prev,
      longTerm: {
        embeddings: [...prev.longTerm.embeddings, memoryWithEmbedding],
        storage: [...prev.longTerm.storage, message],
      },
    }));
  };

  const searchMemory = async (query: string) => {
    if (!selectedModel) return [];

    const similarMemories = await MemoryService.searchSimilarMemories(
      query,
      selectedModel.name,
      memory.longTerm.embeddings
    );

    return similarMemories.map(m => m.message);
  };

  const executeTool = async (name: string, args: any) => {
    return await toolService.executeTool(name, args);
  };

  return (
    <AgentContext.Provider
      value={{
        selectedModel,
        memory,
        tools: toolService.getTools(),
        setSelectedModel,
        addToShortTermMemory,
        addToLongTermMemory,
        searchMemory,
        executeTool,
      }}
      data-testid="agent-provider"
    >
      {children}
    </AgentContext.Provider>
  );
}

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}; 