import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

vi.mock('./api/ollama', () => ({
  ollamaApi: {
    listModels: vi.fn().mockResolvedValue([
      { name: 'model1' },
      { name: 'model2' },
    ]),
  },
}));

describe('App', () => {
  it('renders without crashing', async () => {
    render(<App />);
    // Initially shows loading state
    expect(screen.getByText('Loading models...')).toBeInTheDocument();
    // Wait for the models to load
    await waitFor(() => {
      expect(screen.getByLabelText('Select Model')).toBeInTheDocument();
    });
  });

  it('initializes with required providers', () => {
    render(<App />);
    // Check for the message input which is rendered by the Chat component
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
  });

  it('uses the correct theme', () => {
    render(<App />);
    // Check that the theme is applied to the input field
    const input = screen.getByPlaceholderText('Type your message...');
    const inputContainer = input.closest('.MuiOutlinedInput-root');
    expect(inputContainer).toHaveStyle({ backgroundColor: 'rgba(255, 255, 255, 0.7)' });
  });
}); 