import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Mock config
vi.mock('../config', () => ({
  config: {
    ollamaBaseUrl: 'http://localhost:11434',
    email: {
      user: 'test@example.com',
      password: 'password',
      host: 'imap.example.com',
      port: 993,
      tls: true,
    },
  },
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes('InvalidCity')) {
        const error = new AxiosError();
        error.response = {
          status: 404,
          data: 'City not found',
          statusText: 'Not Found',
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        };
        throw error;
      }
      return Promise.resolve({
        data: {
          main: {
            temp: 20,
            humidity: 50,
          },
          weather: [
            {
              description: 'clear sky',
            },
          ],
          wind: {
            speed: 5,
          },
        },
      });
    }),
    post: vi.fn(),
    isAxiosError: vi.fn().mockImplementation((error: Error) => error instanceof AxiosError),
  },
}));

// Mock EmailService
vi.mock('../services/EmailService', () => {
  return {
    EmailService: class MockEmailService {
      async getUnreadEmails() {
        return [];
      }
    }
  };
}); 