import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import App from './App';

const mockRender = vi.fn();
const mockCreateRoot = vi.fn(() => ({ render: mockRender }));

vi.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot,
}));

describe('main', () => {
  beforeEach(() => {
    // Create a mock element to simulate the root element
    const mockElement = document.createElement('div');
    mockElement.id = 'root';
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    // Clean up the mock element
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders the app into the root element', async () => {
    // Import the main module which will execute the code
    await import('./main');

    // Verify that createRoot was called with the root element
    expect(mockCreateRoot).toHaveBeenCalledWith(
      document.getElementById('root')
    );

    // Verify that render was called with the App component wrapped in StrictMode
    expect(mockRender).toHaveBeenCalledWith(
      expect.objectContaining({
        type: React.StrictMode,
        props: expect.objectContaining({
          children: expect.objectContaining({
            type: App,
          }),
        }),
      })
    );
  });
}); 