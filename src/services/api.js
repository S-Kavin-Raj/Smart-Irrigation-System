// Low-level API abstraction layer
// Communicates with real ESP8266 or backend REST API endpoints.
// ZERO simulated/mock responses. If the device/backend is unavailable, network errors are thrown/handled.

const DEFAULT_API_BASE_URL = 'http://192.168.137.253';

export const getApiBaseUrl = () => {
  const custom = localStorage.getItem('esp_api_endpoint');
  if (custom && custom.trim() && !custom.includes('192.168.1.142')) {
    return custom.trim().replace(/\/+$/, '');
  }
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return DEFAULT_API_BASE_URL;
};

export const setApiBaseUrl = (url) => {
  if (url && url.trim()) {
    localStorage.setItem('esp_api_endpoint', url.trim().replace(/\/+$/, ''));
  } else {
    localStorage.removeItem('esp_api_endpoint');
  }
};

/**
 * Normalizes and resolves full API URLs.
 * Handles baseUrl with or without '/api' and endpoint with or without '/api'.
 */
export function resolveApiUrl(baseUrl, endpoint) {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  const cleanBase = baseUrl.trim().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.trim().replace(/^\/+/, '');

  if (cleanBase.endsWith('/api')) {
    if (cleanEndpoint.startsWith('api/')) {
      return `${cleanBase}/${cleanEndpoint.slice(4)}`;
    }
    return `${cleanBase}/${cleanEndpoint}`;
  }

  if (cleanEndpoint.startsWith('api/')) {
    return `${cleanBase}/${cleanEndpoint}`;
  }

  return `${cleanBase}/api/${cleanEndpoint}`;
}

/**
 * Generic HTTP client wrapper with configurable timeout
 * Supports JSON, URLSearchParams, form-urlencoded and text responses
 */
export async function apiClient(endpoint, { body, timeoutMs = 4000, ...customConfig } = {}) {
  const baseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {};
  let formattedBody = undefined;

  if (body !== undefined && body !== null) {
    if (body instanceof URLSearchParams) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      formattedBody = body.toString();
    } else if (typeof body === 'string') {
      formattedBody = body;
    } else {
      headers['Content-Type'] = 'application/json';
      formattedBody = JSON.stringify(body);
    }
  }

  const config = {
    method: body ? 'POST' : 'GET',
    signal: controller.signal,
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (formattedBody !== undefined) {
    config.body = formattedBody;
  }

  try {
    const url = resolveApiUrl(baseUrl, endpoint);
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const parsed = JSON.parse(errorText);
            if (parsed.error || parsed.message) {
              errorMsg = parsed.error || parsed.message;
            }
          } catch {
            if (errorText.length < 120) {
              errorMsg = errorText;
            }
          }
        }
      } catch {}
      throw new Error(errorMsg);
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
