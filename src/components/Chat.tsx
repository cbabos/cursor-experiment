import { useState } from 'react';
import { Box, TextField, Button, Typography, styled } from '@mui/material';
import { useAgent } from '../context/AgentContext';
import { ollamaApi } from '../api/ollama';
import { MessageParser } from '../services/MessageParser';
import { Message, ChatMessage } from '../types';
import { ModelSelector } from './ModelSelector';
import SendIcon from '@mui/icons-material/Send';

// Styled components
const ChatContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: '#F2F2F7',
  color: '#000000',
});

const ChatLog = styled(Box)({
  flexGrow: 1,
  overflowY: 'auto',
  padding: '20px',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0, 0, 0, 0.05)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.3)',
    },
  },
});

const InputArea = styled(Box)({
  padding: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(10px)',
  borderTop: '1px solid rgba(0, 0, 0, 0.1)',
  boxShadow: '0 -5px 20px rgba(0, 0, 0, 0.05)',
});

const MessageBubble = styled(Box)({
  margin: '10px 0',
  padding: '12px 16px',
  maxWidth: '80%',
  borderRadius: '16px',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
  alignSelf: 'flex-start',
  '&.user': {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignSelf: 'flex-end',
  },
});

const RetroTypography = styled(Typography)({
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: '15px',
  lineHeight: '1.4',
  color: '#000000',
});

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
    console.log('Processing tool calls from content:', content);
    const toolCalls = MessageParser.parseToolCalls(content);
    console.log('Parsed tool calls:', toolCalls);
    if (toolCalls.length === 0) return content;

    let processedContent = content;
    for (const toolCall of toolCalls) {
      try {
        console.log('Executing tool:', toolCall.name, 'with args:', toolCall.args);
        const result = await executeTool(toolCall.name, toolCall.args);
        console.log('Tool execution result:', result);
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
    console.log('Available tools:', tools);
    const toolDescriptions = tools.map(tool => 
      `${tool.name}: ${tool.description} - Use with /tool:${tool.name}{}`
    ).join('\n');

    const systemPrompt = `You have access to the following tools:\n${toolDescriptions}\n\n` +
           `IMPORTANT: When using tools, you must use the exact format shown below:\n` +
           `1. For tools with arguments: /tool:name{arg1: value1, arg2: value2}\n` +
           `2. For tools without arguments (like email): /tool:email{}\n\n` +
           `Examples:\n` +
           `- To check weather: /tool:weather{location: London}\n` +
           `- To check emails: /tool:email{}\n\n` +
           `DO NOT make up or simulate responses. Always use the actual tool calls.`;
    
    console.log('System prompt:', systemPrompt);
    return systemPrompt;
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
    <ChatContainer>
      <ChatLog>
        {memory.shortTerm.map((message, index) => (
          <MessageBubble
            key={index}
            className={message.role === 'user' ? 'user' : ''}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <RetroTypography
              sx={{
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {message.content}
            </RetroTypography>
          </MessageBubble>
        ))}
      </ChatLog>
      
      <InputArea>
        <Box sx={{ mb: 2 }}>
          <ModelSelector />
        </Box>
        <Box
          component="form"
          onSubmit={handleSubmit}
          role="form"
          sx={{
            display: 'flex',
            gap: 1,
          }}
        >
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            sx={{
              '& .MuiInputBase-input': {
                color: '#000000',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                fontSize: '15px',
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!selectedModel || isLoading}
            sx={{
              minWidth: '100px',
              height: '56px',
              animation: isLoading ? 'pulse 1s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.5 },
                '100%': { opacity: 1 },
              },
              backgroundColor: 'rgba(0, 122, 255, 0.9)',
              '&:hover': {
                backgroundColor: 'rgba(0, 122, 255, 0.8)',
              },
            }}
          >
            {isLoading ? '...' : <SendIcon />}
          </Button>
        </Box>
      </InputArea>
    </ChatContainer>
  );
} 