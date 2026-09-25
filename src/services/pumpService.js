import { apiClient } from './api';

export const pumpService = {
  /**
   * Fetch current hardware pump status from ESP8266
   * Endpoint: GET /api/pump
   * Expected: { pumpState: 'ON'|'OFF', mode: 'AUTO'|'MANUAL', runningDurationSeconds, remainingSeconds }
   */
  async getStatus() {
    return await apiClient('/pump', { timeoutMs: 3000 });
  },

  /**
   * Send start manual irrigation command to ESP8266
   * Endpoint: POST /api/pump/start
   * Payload: { duration: number }
   */
  async start(durationSeconds) {
    return await apiClient('/pump/start', {
      body: { duration: durationSeconds },
      timeoutMs: 4000
    });
  },

  /**
   * Send stop pump command to ESP8266
   * Endpoint: POST /api/pump/stop
   * Payload: { reason: string }
   */
  async stop(reason = 'manual_stop') {
    return await apiClient('/pump/stop', {
      body: { reason },
      timeoutMs: 4000
    });
  },

  /**
   * Change irrigation operating mode on ESP8266
   * Endpoint: POST /api/pump/mode
   * Payload: { mode: 'AUTO'|'MANUAL' }
   */
  async setMode(mode) {
    return await apiClient('/pump/mode', {
      body: { mode },
      timeoutMs: 4000
    });
  }
};
