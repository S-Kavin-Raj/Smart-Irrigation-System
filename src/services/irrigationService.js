import { apiClient } from './api';
import { deviceService } from './deviceService';
import { sensorService } from './sensorService';
import { pumpService } from './pumpService';
import { wifiService } from './wifiService';

export const irrigationService = {
  device: deviceService,
  sensors: sensorService,
  pump: pumpService,
  wifi: wifiService,

  /**
   * Fetch irrigation history records from backend/ESP8266
   * Endpoint: GET /api/irrigation/history
   * Expected: Array of real records or empty array
   */
  async getHistory() {
    return await apiClient('/irrigation/history', { timeoutMs: 3000 });
  }
};

export default irrigationService;
