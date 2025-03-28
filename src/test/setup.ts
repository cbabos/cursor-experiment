import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the config
vi.mock('../config', () => ({
  config: {
    weatherApiKey: 'test-api-key'
  }
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  isAxiosError: vi.fn(),
})); 