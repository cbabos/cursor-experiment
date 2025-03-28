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

export class WeatherService {
  static async getCurrentWeather(location: string): Promise<string> {
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

      const { weather, main, wind, name } = response.data;
      
      return `Current weather in ${name}:
Temperature: ${Math.round(main.temp)}°C (feels like ${Math.round(main.feels_like)}°C)
Conditions: ${weather[0].description}
Humidity: ${main.humidity}%
Wind Speed: ${Math.round(wind.speed * 3.6)} km/h`;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return `Location "${location}" not found. Please check the spelling and try again.`;
      }
      return `Error fetching weather data: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
} 