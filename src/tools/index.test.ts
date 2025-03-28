import { describe, it, expect, vi, beforeEach } from 'vitest';
import { weatherTool, calculatorTool, searchTool } from '.';
import { WeatherService } from '../services/WeatherService';

vi.mock('../services/WeatherService', () => ({
  WeatherService: {
    getCurrentWeather: vi.fn(),
  },
}));

describe('Tools', () => {
  describe('weatherTool', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return weather for a valid location', async () => {
      const mockWeather = {
        temperature: 25,
        humidity: 60,
        description: 'sunny',
        windSpeed: 10,
      };
      vi.mocked(WeatherService.getCurrentWeather).mockResolvedValue(mockWeather);

      const result = await weatherTool.execute({ location: 'London' });

      expect(WeatherService.getCurrentWeather).toHaveBeenCalledWith('London');
      expect(result).toBe('Temperature: 25°C, Humidity: 60%, Conditions: sunny, Wind Speed: 10 km/h');
    });

    it('should return error message when location is missing', async () => {
      const result = await weatherTool.execute({ location: '' });

      expect(result).toBe('Error: Location is required');
      expect(WeatherService.getCurrentWeather).not.toHaveBeenCalled();
    });

    it('should handle weather service errors', async () => {
      const mockError = { error: 'Location not found' };
      vi.mocked(WeatherService.getCurrentWeather).mockResolvedValue(mockError);

      const result = await weatherTool.execute({ location: 'InvalidCity' });

      expect(WeatherService.getCurrentWeather).toHaveBeenCalledWith('InvalidCity');
      expect(result).toBe('Error: Location not found');
    });
  });

  describe('calculatorTool', () => {
    it('should evaluate simple arithmetic expressions', async () => {
      const result = await calculatorTool.execute({ expression: '2 + 2' });
      expect(result).toBe('4');
    });

    it('should handle complex expressions', async () => {
      const result = await calculatorTool.execute({ expression: '(10 * 5) / 2' });
      expect(result).toBe('25');
    });

    it('should return error message for invalid expressions', async () => {
      const result = await calculatorTool.execute({ expression: 'invalid' });
      expect(result).toContain('Error calculating:');
    });

    it('should handle division by zero', async () => {
      const result = await calculatorTool.execute({ expression: '1/0' });
      expect(result).toBe('Infinity');
    });
  });

  describe('searchTool', () => {
    it('should return search query message', async () => {
      const result = await searchTool.execute({ query: 'test query' });
      expect(result).toBe('Searching for: test query');
    });
  });

  describe('Tool metadata', () => {
    it('should have correct metadata for weather tool', () => {
      expect(weatherTool.name).toBe('weather');
      expect(weatherTool.description).toContain('weather conditions');
    });

    it('should have correct metadata for calculator tool', () => {
      expect(calculatorTool.name).toBe('calculator');
      expect(calculatorTool.description).toContain('mathematical calculations');
    });

    it('should have correct metadata for search tool', () => {
      expect(searchTool.name).toBe('search');
      expect(searchTool.description).toContain('long-term memory');
    });
  });
}); 