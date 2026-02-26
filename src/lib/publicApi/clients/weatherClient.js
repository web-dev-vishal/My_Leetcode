import BaseAPIClient from '../baseApiClient.js';

class WeatherAPIClient extends BaseAPIClient {
  constructor(config) {
    super(config);
  }

  /**
   * Get current weather by coordinates
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} - Weather data
   */
  async getCurrentWeather(lat, lon) {
    const response = await this.get('/weather', { lat, lon, units: 'metric' });
    return response;
  }

  /**
   * Get current weather by city name
   * @param {string} city - City name
   * @param {string} country - Country code (optional)
   * @returns {Promise<Object>} - Weather data
   */
  async getCurrentWeatherByCity(city, country = null) {
    const q = country ? `${city},${country}` : city;
    const response = await this.get('/weather', { q, units: 'metric' });
    return response;
  }

  /**
   * Get weather forecast
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {number} days - Number of days (default 5)
   * @returns {Promise<Object>} - Forecast data
   */
  async getForecast(lat, lon, days = 5) {
    const cnt = days * 8; // 8 forecasts per day (3-hour intervals)
    const response = await this.get('/forecast', { lat, lon, cnt, units: 'metric' });
    return response;
  }

  /**
   * Transform OpenWeatherMap response to standard format
   * @param {Object} data - Raw API response
   * @returns {Object} - Transformed weather data
   */
  transformResponse(data) {
    if (data.cod && data.cod !== 200) {
      return data; // Return error as-is
    }

    // Handle current weather response
    if (data.main && data.weather) {
      return {
        location: {
          name: data.name || 'Unknown',
          country: data.sys?.country || '',
          coordinates: {
            lat: data.coord?.lat,
            lon: data.coord?.lon
          }
        },
        current: {
          temperature: {
            celsius: Math.round(data.main.temp),
            fahrenheit: Math.round(data.main.temp * 9/5 + 32)
          },
          feelsLike: {
            celsius: Math.round(data.main.feels_like),
            fahrenheit: Math.round(data.main.feels_like * 9/5 + 32)
          },
          condition: data.weather[0]?.description || 'Unknown',
          humidity: data.main.humidity,
          windSpeed: data.wind?.speed || 0,
          pressure: data.main.pressure,
          visibility: data.visibility || 0
        }
      };
    }

    // Handle forecast response
    if (data.list) {
      return {
        location: {
          name: data.city?.name || 'Unknown',
          country: data.city?.country || '',
          coordinates: {
            lat: data.city?.coord?.lat,
            lon: data.city?.coord?.lon
          }
        },
        forecast: data.list.map(item => ({
          date: item.dt_txt,
          temperature: {
            celsius: Math.round(item.main.temp),
            fahrenheit: Math.round(item.main.temp * 9/5 + 32)
          },
          condition: item.weather[0]?.description || 'Unknown',
          humidity: item.main.humidity,
          windSpeed: item.wind?.speed || 0
        }))
      };
    }

    return data;
  }
}

export default WeatherAPIClient;
