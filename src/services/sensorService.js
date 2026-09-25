import { apiClient } from './api';

export const sensorService = {
  /**
   * Fetch current sensor telemetry from ESP8266
   * Endpoint: GET /api/sensors
   * Expected: { soilMoisture, temperature, humidity, rainDetected, pumpState, irrigationMode, timestamp }
   */
  async getSensors() {
    return await apiClient('/sensors', { timeoutMs: 3000 });
  },

  /**
   * Fetch sensor trend history from backend/device if available
   * Endpoint: GET /api/sensors/trends
   */
  async getTrends() {
    return await apiClient('/sensors/trends', { timeoutMs: 8000 });
  }
};
