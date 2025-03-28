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
  backgroundColor: '#000000',
  color: '#00ff00',
});

const ChatLog = styled(Box)({
  flexGrow: 1,
  overflowY: 'auto',
  padding: '20px',
  '&::-webkit-scrollbar': {
    width: '10px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#001100',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#00ff00',
    border: '2px solid #001100',
  },
});

const InputArea = styled(Box)({
  borderTop: '2px solid #00ff00',
  padding: '20px',
  backgroundColor: '#001100',
});

const MessageBubble = styled(Box)({
  margin: '10px 0',
  padding: '10px',
  maxWidth: '80%',
  border: '2px solid #00ff00',
  backgroundColor: '#001100',
  alignSelf: 'flex-start',
  position: 'relative',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: '-2px',
    left: '-2px',
    right: '-2px',
    bottom: '-2px',
    border: '2px solid #00ff00',
    pointerEvents: 'none',
  },
  '&.user': {
    backgroundColor: '#003300',
    alignSelf: 'flex-end',
  },
});

const RetroTypography = styled(Typography)({
  fontFamily: '"Press Start 2P", "Courier New", monospace',
  fontSize: '14px',
  lineHeight: '1.5',
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
                color: '#00ff00',
                fontFamily: '"Press Start 2P", "Courier New", monospace',
                fontSize: '14px',
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
            }}
          >
            {isLoading ? '...' : <SendIcon />}
          </Button>
        </Box>
      </InputArea>
    </ChatContainer>
  );
} 