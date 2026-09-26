import { apiClient } from './api';

export const sensorService = {
  /**
   * Fetch current sensor telemetry from ESP8266
   * Endpoint: GET /api/sensors
   * Expected: { soilRaw, soilMoisture, rainRaw, rainDetected, temperature, humidity }
   */
  async getSensors() {
    const res = await apiClient('/sensors', { timeoutMs: 3000 });
    if (!res) return null;
    return {
      soilRaw: res.soilRaw ?? null,
      soilMoisture: typeof res.soilMoisture === 'number' ? res.soilMoisture : null,
      rainRaw: res.rainRaw ?? null,
      rainDetected: Boolean(res.rainDetected),
      temperature: typeof res.temperature === 'number' ? res.temperature : null,
      humidity: typeof res.humidity === 'number' ? res.humidity : null,
      timestamp: res.timestamp || new Date().toISOString()
    };
  },

  /**
   * Fetch sensor trend history from ESP8266
   * Endpoint: GET /api/sensors/trends
   * Expected: { trends: [ { timestamp, soilMoisture, temperature, humidity, rain }, ... ] }
   */
  async getTrends() {
    const res = await apiClient('/sensors/trends', { timeoutMs: 8000 });
    if (!res) return [];
    const list = Array.isArray(res) ? res : (Array.isArray(res.trends) ? res.trends : []);
    return list.map((item, idx) => {
      let timeLabel = item.time;
      if (!timeLabel && item.timestamp !== undefined) {
        if (typeof item.timestamp === 'number') {
          if (item.timestamp > 1000000) {
            const d = new Date(item.timestamp > 1e11 ? item.timestamp : item.timestamp * 1000);
            timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          } else {
            const m = Math.floor(item.timestamp / 60);
            const s = item.timestamp % 60;
            timeLabel = `${m}m ${s}s`;
          }
        } else {
          timeLabel = String(item.timestamp);
        }
      }
      return {
        ...item,
        time: timeLabel || `T-${idx}`,
        soilMoisture: Number(item.soilMoisture ?? 0),
        temperature: Number(item.temperature ?? 0),
        humidity: Number(item.humidity ?? 0),
        rain: item.rain ?? 0
      };
    });
  }
};
