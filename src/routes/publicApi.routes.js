import express from 'express';
import {
  getCurrentWeather,
  getWeatherForecast,
  getAPIRegistry,
  getAPIHealth
} from '../controllers/publicApi.controller.js';

const router = express.Router();

// Weather endpoints
router.get('/weather/current', getCurrentWeather);
router.get('/weather/forecast', getWeatherForecast);

// Management endpoints
router.get('/registry', getAPIRegistry);
router.get('/health', getAPIHealth);

export default router;
