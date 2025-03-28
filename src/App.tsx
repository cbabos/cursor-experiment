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
      main: '#00ff00', // Classic green terminal color
    },
    background: {
      default: '#000000',
      paper: '#000000',
    },
    text: {
      primary: '#00ff00',
      secondary: '#00cc00',
    },
  },
  typography: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '2px solid #00ff00',
          '&:hover': {
            backgroundColor: '#003300',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            backgroundColor: '#001100',
            '& fieldset': {
              borderColor: '#00ff00',
            },
            '&:hover fieldset': {
              borderColor: '#00ff00',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: '#001100',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#00ff00',
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