import axios from 'axios';
import { config } from '../config';

const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

interface WeatherResponse {
  weather: Array<{
    main: string;
    description: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  name: string;
}

interface WeatherResult {
  temperature: number;
  humidity: number;
  description: string;
  windSpeed: number;
}

interface WeatherError {
  error: string;
}

type WeatherServiceResult = WeatherResult | WeatherError;

export class WeatherService {
  static async getCurrentWeather(location: string): Promise<WeatherServiceResult> {
    try {
      const response = await axios.get<WeatherResponse>(
        `${WEATHER_API_BASE}/weather`,
        {
          params: {
            q: location,
            appid: config.weatherApiKey,
            units: 'metric'
          }
        }
      );

      const { weather, main, wind } = response.data;
      
      return {
        temperature: Math.round(main.temp),
        humidity: main.humidity,
        description: weather[0].description,
        windSpeed: Math.round(wind.speed),
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {
          error: 'Location not found',
        };
      }
      return {
        error: 'Failed to fetch weather data',
      };
    }
  }
} 