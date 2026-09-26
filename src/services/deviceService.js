import { apiClient } from './api';

export const deviceService = {
  /**
   * Check heartbeat/status of ESP8266 controller
   * Endpoint: GET /api/device/status
   */
  async getStatus() {
    const res = await apiClient('/device/status', { timeoutMs: 3000 });
    if (!res) return null;
    const isConn = res.connected === true || (res.ip && res.ip !== '0.0.0.0');
    return {
      connected: isConn,
      status: isConn ? 'Online' : 'Offline',
      deviceId: res.device || res.deviceId || 'AquaFlow ESP8266',
      device: res.device || res.deviceId || 'AquaFlow ESP8266',
      ssid: res.ssid || res.wifiSsid || '',
      wifiSsid: res.ssid || res.wifiSsid || '',
      ip: res.ip || res.ipAddress || '',
      ipAddress: res.ip || res.ipAddress || '',
      rssi: res.rssi ?? null,
      pumpRunning: res.pumpRunning ?? res.running ?? false,
      pumpMode: res.pumpMode || res.mode || 'AUTO',
      uptimeSeconds: res.uptimeSeconds ?? 0,
      macAddress: res.macAddress || '',
      lastSeen: new Date().toISOString()
    };
  },

  /**
   * Update device settings on ESP8266
   * Endpoint: POST /api/settings
   */
  async updateSettings(settings) {
    return await apiClient('/settings', { body: settings });
  }
};
