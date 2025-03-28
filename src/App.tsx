import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline } from '@mui/material';
import { AgentProvider } from './context/AgentContext';
import { Chat } from './components/Chat';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const queryClient = new QueryClient();

// Create a custom theme with retro colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#007AFF', // iOS blue
    },
    background: {
      default: '#F2F2F7', // iOS light gray
      paper: 'rgba(255, 255, 255, 0.7)', // Translucent white
    },
    text: {
      primary: '#000000',
      secondary: '#8E8E93', // iOS secondary text
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0, 122, 255, 0.9)',
          '&:hover': {
            backgroundColor: 'rgba(0, 122, 255, 0.8)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 122, 255, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#007AFF',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 0, 0, 0.1)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 122, 255, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#007AFF',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AgentProvider>
          <CssBaseline />
          <Chat />
        </AgentProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 