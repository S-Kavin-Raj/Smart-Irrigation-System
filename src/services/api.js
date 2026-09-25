// Low-level API abstraction layer
// Communicates with real ESP8266 or backend REST API endpoints.
// ZERO simulated/mock responses. If the device/backend is unavailable, network errors are thrown/handled.

const DEFAULT_API_BASE_URL = 'http://192.168.137.253/api';

export const getApiBaseUrl = () => {
  const custom = localStorage.getItem('esp_api_endpoint');
  if (custom && custom.trim() && !custom.includes('192.168.1.142')) {
    return custom.trim().replace(/\/+$/, '');
  }
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
};

export const setApiBaseUrl = (url) => {
  if (url && url.trim()) {
    localStorage.setItem('esp_api_endpoint', url.trim().replace(/\/+$/, ''));
  } else {
    localStorage.removeItem('esp_api_endpoint');
  }
};

/**
 * Generic HTTP client wrapper with configurable timeout
 */
export async function apiClient(endpoint, { body, timeoutMs = 4000, ...customConfig } = {}) {
  const baseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = { 'Content-Type': 'application/json' };
  const config = {
    method: body ? 'POST' : 'GET',
    signal: controller.signal,
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Connection timed out. Device did not respond.');
    }
    throw error;
  }
}
