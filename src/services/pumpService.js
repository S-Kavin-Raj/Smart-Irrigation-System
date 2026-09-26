import { apiClient } from './api';

export const pumpService = {
  /**
   * Fetch current hardware pump status from ESP8266
   * Endpoint: GET /api/pump
   * Expected: { running: boolean, mode: 'AUTO'|'MANUAL', runtimeSeconds: number }
   */
  async getStatus() {
    const res = await apiClient('/pump', { timeoutMs: 3000 });
    if (!res) return null;
    const isRunning = res.running === true || res.pumpState === 'ON' || res.status === 'ON';
    return {
      running: isRunning,
      pumpState: isRunning ? 'ON' : 'OFF',
      status: isRunning ? 'ON' : 'OFF',
      mode: res.mode || res.pumpMode || 'AUTO',
      runtimeSeconds: res.runtimeSeconds ?? res.runningDurationSeconds ?? 0,
      remainingSeconds: res.remainingSeconds ?? 0
    };
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
