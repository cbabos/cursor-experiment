import { Tool } from '../types';
import { WeatherService } from '../services/WeatherService';

export const weatherTool: Tool = {
  name: 'weather',
  description: 'Get current weather conditions for a location (city name)',
  async execute({ location }: { location: string }) {
    if (!location || location.trim() === '') {
      return 'Error: Location is required';
    }
    const result = await WeatherService.getCurrentWeather(location);
    if ('error' in result) {
      return `Error: ${result.error}`;
    }
    return `Temperature: ${result.temperature}°C, Humidity: ${result.humidity}%, Conditions: ${result.description}, Wind Speed: ${result.windSpeed} km/h`;
  },
};

export const calculatorTool: Tool = {
  name: 'calculator',
  description: 'Perform basic mathematical calculations',
  async execute({ expression }: { expression: string }) {
    try {
      // Note: In a production environment, you'd want to use a safer evaluation method
      return eval(expression).toString();
    } catch (error) {
      return `Error calculating: ${error}`;
    }
  },
};

export const searchTool: Tool = {
  name: 'search',
  description: 'Search through long-term memory',
  async execute({ query }: { query: string }) {
    // This will be implemented in the AgentContext
    return `Searching for: ${query}`;
  },
}; 