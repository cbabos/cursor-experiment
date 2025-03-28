import { useState } from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress } from '@mui/material';
import { useAgent } from '../context/AgentContext';
import { ollamaApi } from '../api/ollama';
import { MessageParser } from '../services/MessageParser';
import { Message } from '../types';

interface SystemMessage {
  role: 'system';
  content: string;
}

export function Chat() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { 
    selectedModel, 
    memory, 
    tools,
    addToShortTermMemory, 
    addToLongTermMemory,
    searchMemory,
    executeTool 
  } = useAgent();

  const processToolCalls = async (content: string): Promise<string> => {
    const toolCalls = MessageParser.parseToolCalls(content);
    if (toolCalls.length === 0) return content;

    let processedContent = content;
    for (const toolCall of toolCalls) {
      try {
        const result = await executeTool(toolCall.name, toolCall.args);
        processedContent = processedContent.replace(
          `/tool:${toolCall.name}{${Object.entries(toolCall.args).map(([k, v]) => `${k}: ${v}`).join(', ')}}`,
          `[${toolCall.name} result: ${result}]`
        );
      } catch (error) {
        console.error(`Tool execution failed:`, error);
        processedContent = processedContent.replace(
          `/tool:${toolCall.name}{${Object.entries(toolCall.args).map(([k, v]) => `${k}: ${v}`).join(', ')}}`,
          `[${toolCall.name} error: ${error}]`
        );
      }
    }
    return processedContent;
  };

  const createSystemPrompt = () => {
    const toolDescriptions = tools.map(tool => 
      `${tool.name}: ${tool.description} - Use with /tool:${tool.name}{args}`
    ).join('\n');

    return `You have access to the following tools:\n${toolDescriptions}\n\n` +
           `To use a tool, include /tool:name{arg1: value1, arg2: value2} in your response.\n` +
           `Example: To check weather use /tool:weather{location: London}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel || !input.trim()) return;

    setIsLoading(true);

    try {
      const userMessage: Message = {
        role: 'user',
        content: input,
        timestamp: Date.now(),
      };
      addToShortTermMemory(userMessage);

      const relevantMemories = await searchMemory(input);
      const contextMessage = relevantMemories.length > 0 
        ? `Relevant context: ${relevantMemories.map(m => m.content).join(' ')}`
        : '';

      const messages: (ChatMessage | SystemMessage)[] = [
        { role: 'system', content: createSystemPrompt() },
        ...(contextMessage ? [{ role: 'system' as const, content: contextMessage }] : []),
        ...memory.shortTerm.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: userMessage.role, content: userMessage.content }
      ];

      const response = await ollamaApi.generateResponse(selectedModel.name, messages as ChatMessage[]);
      
      // Process any tool calls in the response
      const processedContent = await processToolCalls(response.message.content);

      const assistantMessage: Message = {
        role: 'assistant',
        content: processedContent,
        timestamp: Date.now(),
      };

      // Add messages to both short and long-term memory
      addToShortTermMemory(assistantMessage);
      await addToLongTermMemory(userMessage);
      await addToLongTermMemory(assistantMessage);

    } catch (error) {
      console.error('Error:', error);
      addToShortTermMemory({
        role: 'assistant',
        content: 'Sorry, an error occurred while processing your request.',
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper
        sx={{
          height: '400px',
          overflowY: 'auto',
          p: 2,
          mb: 2,
        }}
      >
        {memory.shortTerm.map((message, index) => (
          <Box
            key={index}
            sx={{
              mb: 2,
              textAlign: message.role === 'user' ? 'right' : 'left',
            }}
          >
            <Typography
              sx={{
                display: 'inline-block',
                backgroundColor: message.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                p: 1,
                borderRadius: 1,
              }}
            >
              {message.content}
            </Typography>
          </Box>
        ))}
      </Paper>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
          />
          <Button type="submit" variant="contained" disabled={!selectedModel || isLoading}>
            Send
          </Button>
        </Box>
      </form>
    </Box>
  );
} 