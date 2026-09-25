import { apiClient } from './api';

export const deviceService = {
  /**
   * Check heartbeat/status of ESP8266 controller
   * Endpoint: GET /api/device/status
   */
  async getStatus() {
    return await apiClient('/device/status', { timeoutMs: 3000 });
  },

  /**
   * Update device settings on ESP8266
   * Endpoint: POST /api/settings
   */
  async updateSettings(settings) {
    return await apiClient('/settings', { body: settings });
  }
};
