import { apiClient } from './api';

export const wifiService = {
  /**
   * Fetch Wi-Fi connection state, current SSID, IP, and saved networks from ESP8266
   * Endpoint: GET /api/wifi
   */
  async getStatus() {
    return await apiClient('/api/wifi', { timeoutMs: 4000 });
  },

  /**
   * Add a new Wi-Fi network to the ESP8266 (supports up to 5 stored networks)
   * Endpoint: POST /api/wifi/add
   * Body: application/x-www-form-urlencoded (ssid, password)
   */
  async addNetwork(ssid, password) {
    if (!ssid || !ssid.trim()) {
      throw new Error('SSID / Network Name is required.');
    }

    const body = new URLSearchParams();
    body.append('ssid', ssid.trim());
    body.append('password', password || '');

    return await apiClient('/api/wifi/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      timeoutMs: 8000,
    });
  },

  /**
   * Remove a saved Wi-Fi network by index from the ESP8266
   * Endpoint: POST /api/wifi/remove
   * Body: application/x-www-form-urlencoded (index)
   */
  async removeNetwork(index) {
    const body = new URLSearchParams();
    body.append('index', String(index));

    return await apiClient('/api/wifi/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      timeoutMs: 6000,
    });
  },

  /**
   * Instruct ESP8266 to connect to a saved Wi-Fi network by index
   * Endpoint: POST /api/wifi/connect
   * Body: application/x-www-form-urlencoded (index)
   */
  async connectNetwork(index) {
    const body = new URLSearchParams();
    body.append('index', String(index));

    return await apiClient('/api/wifi/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      timeoutMs: 6000,
    });
  },
};

export default wifiService;
