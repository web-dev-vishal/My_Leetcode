# Postman Testing Guide - Public API Integration

## 🚀 Quick Start

### Prerequisites
1. ✅ Get a FREE OpenWeatherMap API key: https://openweathermap.org/api
2. ✅ Add it to your `.env` file:
   ```bash
   WEATHER_API_KEY="your-api-key-here"
   ```
3. ✅ Start your server:
   ```bash
   npm start
   ```

### Import Postman Collection
1. Open Postman
2. Click "Import" button
3. Select `postman/Public_API_Integration.postman_collection.json`
4. Collection will be imported with 5 test endpoints

---

## 📋 Available Endpoints

### 1. Health Check ✅
**Endpoint**: `GET /api/v1/public-apis/health`

**Purpose**: Verify the Public API integration system is running

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-27T00:00:00.000Z",
    "message": "Public API integration is operational"
  }
}
```

**Test This First**: This endpoint works WITHOUT any API keys!

---

### 2. Get API Registry ✅
**Endpoint**: `GET /api/v1/public-apis/registry`

**Purpose**: List all configured APIs

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "total": 1,
    "apis": [
      {
        "name": "openweathermap",
        "displayName": "OpenWeatherMap",
        "category": "weather",
        "description": "Weather data and forecasts",
        "configured": true
      }
    ]
  }
}
```

**Note**: Shows only APIs with valid API keys in `.env`

---

### 3. Get Weather by City 🌤️
**Endpoint**: `GET /api/v1/public-apis/weather/current`

**Query Parameters**:
- `city` (required): City name (e.g., "London", "New York", "Tokyo")
- `country` (optional): Country code (e.g., "UK", "US", "JP")

**Example Request**:
```
GET http://localhost:8080/api/v1/public-apis/weather/current?city=London
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "location": {
      "name": "London",
      "country": "GB",
      "coordinates": {
        "lat": 51.5074,
        "lon": -0.1278
      }
    },
    "current": {
      "temperature": {
        "celsius": 15,
        "fahrenheit": 59
      },
      "feelsLike": {
        "celsius": 13,
        "fahrenheit": 55
      },
      "condition": "partly cloudy",
      "humidity": 72,
      "windSpeed": 5.5,
      "pressure": 1013,
      "visibility": 10000
    }
  },
  "metadata": {
    "source": "openweathermap",
    "timestamp": "2026-02-27T00:00:00.000Z",
    "cached": false,
    "responseTime": 245
  }
}
```

**Test Cities**:
- London
- New York
- Tokyo
- Paris
- Mumbai

---

### 4. Get Weather by Coordinates 📍
**Endpoint**: `GET /api/v1/public-apis/weather/current`

**Query Parameters**:
- `lat` (required): Latitude (e.g., 51.5074)
- `lon` (required): Longitude (e.g., -0.1278)

**Example Request**:
```
GET http://localhost:8080/api/v1/public-apis/weather/current?lat=51.5074&lon=-0.1278
```

**Test Coordinates**:
- London: `lat=51.5074&lon=-0.1278`
- New York: `lat=40.7128&lon=-74.0060`
- Tokyo: `lat=35.6762&lon=139.6503`
- Paris: `lat=48.8566&lon=2.3522`

---

### 5. Get Weather Forecast 📅
**Endpoint**: `GET /api/v1/public-apis/weather/forecast`

**Query Parameters**:
- `lat` (required): Latitude
- `lon` (required): Longitude
- `days` (optional): Number of days (default: 5, max: 5)

**Example Request**:
```
GET http://localhost:8080/api/v1/public-apis/weather/forecast?lat=51.5074&lon=-0.1278&days=5
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "location": {
      "name": "London",
      "country": "GB",
      "coordinates": {
        "lat": 51.5074,
        "lon": -0.1278
      }
    },
    "forecast": [
      {
        "date": "2026-02-27 12:00:00",
        "temperature": {
          "celsius": 16,
          "fahrenheit": 61
        },
        "condition": "light rain",
        "humidity": 75,
        "windSpeed": 6.2
      }
      // ... more forecast entries
    ]
  },
  "metadata": {
    "source": "openweathermap",
    "timestamp": "2026-02-27T00:00:00.000Z",
    "cached": false,
    "responseTime": 312
  }
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Basic Functionality ✅
1. **Health Check** - Verify system is running
2. **API Registry** - Check configured APIs
3. **Weather by City** - Get weather for "London"
4. **Verify Response** - Check all fields are present

### Scenario 2: Caching 🚀
1. **First Request**: Get weather for London
   - Note `"cached": false` in metadata
   - Note `responseTime` (e.g., 245ms)
2. **Second Request**: Get weather for London again (within 10 minutes)
   - Should see `"cached": true` in metadata
   - Should see faster `responseTime` (e.g., 5ms)

### Scenario 3: Different Locations 🌍
1. Get weather for multiple cities:
   - London, UK
   - New York, US
   - Tokyo, JP
   - Paris, FR
2. Verify each returns correct location data

### Scenario 4: Coordinates vs City 📍
1. Get weather by city: `?city=London`
2. Get weather by coordinates: `?lat=51.5074&lon=-0.1278`
3. Compare results - should be similar

### Scenario 5: Error Handling ❌
1. **Missing API Key**:
   - Remove `WEATHER_API_KEY` from `.env`
   - Restart server
   - Try weather request
   - Should get: `"API_NOT_CONFIGURED"` error

2. **Invalid Parameters**:
   - Request without city or coordinates
   - Should get: `"INVALID_PARAMETERS"` error

3. **Invalid City**:
   - Request with `?city=InvalidCityName123`
   - Should get error from OpenWeatherMap

---

## 📊 Response Status Codes

| Code | Meaning | When You'll See It |
|------|---------|-------------------|
| 200 | Success | Valid request with data |
| 400 | Bad Request | Missing required parameters |
| 404 | Not Found | Invalid city name |
| 500 | Server Error | Internal error or API key issue |
| 503 | Service Unavailable | API is down or not configured |

---

## 🔍 Debugging Tips

### Issue: "API_NOT_CONFIGURED" Error
**Solution**:
1. Check `.env` file has `WEATHER_API_KEY`
2. Verify API key is valid (test at openweathermap.org)
3. Restart server after adding key

### Issue: Slow Response Times
**Possible Causes**:
1. First request (not cached) - Normal
2. OpenWeatherMap API is slow - Normal
3. Network issues - Check internet connection

**Check**:
- Second request should be fast (cached)
- `responseTime` in metadata shows actual time

### Issue: "EXTERNAL_API_ERROR"
**Possible Causes**:
1. Invalid API key
2. API quota exceeded (60 calls/min free tier)
3. OpenWeatherMap service down

**Solution**:
- Wait a minute and try again
- Check API key validity
- Check OpenWeatherMap status page

---

## 🎯 Expected Performance

### Response Times
- **Cached**: 5-20ms ⚡
- **Uncached**: 200-500ms 🌐
- **Forecast**: 300-600ms 📊

### Cache Behavior
- **TTL**: 600 seconds (10 minutes)
- **Key**: Based on API + endpoint + parameters
- **Storage**: Redis

### Rate Limits
- **OpenWeatherMap Free**: 60 calls/minute
- **Our System**: No additional limits (yet)

---

## 📝 Sample Test Results

### ✅ Successful Test
```json
{
  "success": true,
  "data": {
    "location": {
      "name": "London",
      "country": "GB"
    },
    "current": {
      "temperature": {
        "celsius": 15,
        "fahrenheit": 59
      },
      "condition": "partly cloudy"
    }
  },
  "metadata": {
    "cached": false,
    "responseTime": 245
  }
}
```

### ❌ Error Response
```json
{
  "success": false,
  "error": {
    "code": "API_NOT_CONFIGURED",
    "message": "Weather API is not configured. Please add WEATHER_API_KEY to .env file"
  }
}
```

---

## 🚀 Next Steps

After testing weather endpoints:

1. **Add More APIs**:
   - Get Finance API key (Alpha Vantage)
   - Get News API key (NewsAPI)
   - Add to `.env` file

2. **Test Advanced Features**:
   - Rate limiting (make 61 requests in 1 minute)
   - Cache invalidation
   - Error recovery

3. **Monitor Performance**:
   - Check Redis for cached entries
   - Monitor response times
   - Track API usage

---

## 📞 Support

### Common Questions

**Q: Do I need to pay for API keys?**
A: No! All APIs have free tiers:
- Weather: 60 calls/min free
- Finance: 25 calls/day free
- News: 100 calls/day free

**Q: Why is the first request slow?**
A: First request hits the external API. Subsequent requests use cache (10x faster).

**Q: Can I test without API keys?**
A: Yes! Health check and registry endpoints work without keys.

**Q: How do I clear the cache?**
A: Restart Redis or wait 10 minutes for TTL expiration.

---

## ✅ Checklist

Before reporting issues, verify:
- [ ] Server is running (`npm start`)
- [ ] Redis is running
- [ ] `.env` has `WEATHER_API_KEY`
- [ ] API key is valid
- [ ] Postman collection is imported
- [ ] Base URL is `http://localhost:8080`

---

**Happy Testing! 🎉**

For issues or questions, check:
- `CODE_REVIEW_REPORT.md` - Known issues
- `IMPLEMENTATION_STATUS.md` - Current status
- `.kiro/specs/public-api-integration/design.md` - Technical details
