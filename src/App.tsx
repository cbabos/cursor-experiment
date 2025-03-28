import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Container, CssBaseline } from '@mui/material';
import { AgentProvider } from './context/AgentContext';
import { ModelSelector } from './components/ModelSelector';
import { Chat } from './components/Chat';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AgentProvider>
        <CssBaseline />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <ModelSelector />
          <Chat />
        </Container>
      </AgentProvider>
    </QueryClientProvider>
  );
}

export default App; 