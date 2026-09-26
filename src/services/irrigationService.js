import { apiClient } from './api';
import { deviceService } from './deviceService';
import { sensorService } from './sensorService';
import { pumpService } from './pumpService';

export const irrigationService = {
  device: deviceService,
  sensors: sensorService,
  pump: pumpService,

  /**
   * Fetch irrigation history records from backend/ESP8266
   * Endpoint: GET /api/irrigation/history
   * Expected: { history: [ { timestamp, soilMoisture, temperature, humidity, rain, pump, mode }, ... ] }
   */
  async getHistory() {
    const res = await apiClient('/irrigation/history', { timeoutMs: 3000 });
    if (!res) return [];
    const list = Array.isArray(res) ? res : (Array.isArray(res.history) ? res.history : []);
    return list.map((item, idx) => {
      let dateStr = item.date;
      let timeStr = item.startTime;
      if (!dateStr || !timeStr) {
        if (item.timestamp && typeof item.timestamp === 'number' && item.timestamp > 1000000) {
          const d = new Date(item.timestamp > 1e11 ? item.timestamp : item.timestamp * 1000);
          dateStr = dateStr || d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          timeStr = timeStr || d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } else {
          dateStr = dateStr || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          timeStr = timeStr || (typeof item.timestamp === 'number' ? `${Math.floor(item.timestamp / 60)}m ${item.timestamp % 60}s` : new Date().toLocaleTimeString());
        }
      }
      const isPumpOn = item.pump === true || item.running === true || item.pumpState === 'ON';
      return {
        id: item.id || `hist-${idx}-${item.timestamp || Date.now()}`,
        date: dateStr,
        startTime: timeStr,
        endTime: item.endTime || '--',
        durationSeconds: item.durationSeconds ?? item.runtimeSeconds ?? (isPumpOn ? 10 : 0),
        durationText: item.durationText || `${item.durationSeconds ?? item.runtimeSeconds ?? (isPumpOn ? 10 : 0)}s`,
        mode: item.mode || 'AUTO',
        trigger: item.trigger || (item.mode === 'MANUAL' ? 'Manual Operator' : (item.soilMoisture !== undefined && item.soilMoisture <= 35 ? 'Dry Soil' : 'Autonomous Cycle')),
        status: item.status || (isPumpOn ? 'Active' : 'Completed'),
        ...item
      };
    });
  }
};

export default irrigationService;
