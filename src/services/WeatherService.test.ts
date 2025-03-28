import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { WeatherService } from './WeatherService';

vi.mock('axios');

describe('WeatherService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return formatted weather data for valid location', async () => {
    const mockResponse = {
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
    };

    (axios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    const result = await WeatherService.getCurrentWeather('London');

    expect(result).toEqual({
      temperature: 20,
      humidity: 50,
      description: 'clear sky',
      windSpeed: 5,
    });
  });

  it('should handle location not found error', async () => {
    const error = new AxiosError();
    error.response = {
      status: 404,
      data: 'City not found',
      statusText: 'Not Found',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    (axios.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);
    vi.spyOn(axios, 'isAxiosError').mockReturnValueOnce(true);

    const result = await WeatherService.getCurrentWeather('InvalidCity');

    expect(result).toEqual({
      error: 'Location not found',
    });
  });

  it('should handle general errors', async () => {
    const error = new Error('Network error');
    (axios.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);
    vi.spyOn(axios, 'isAxiosError').mockReturnValueOnce(false);

    const result = await WeatherService.getCurrentWeather('London');

    expect(result).toEqual({
      error: 'Failed to fetch weather data',
    });
  });
}); 