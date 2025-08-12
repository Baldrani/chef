/**
 * API client utility that ensures API calls work correctly regardless of locale routing
 */

type ApiRequestInit = Omit<RequestInit, 'method'> & {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
};

/**
 * Makes an API request with the correct base URL that bypasses locale routing
 */
export async function apiRequest(endpoint: string, options: ApiRequestInit = {}): Promise<Response> {
  // Ensure the endpoint starts with /api/
  const apiEndpoint = endpoint.startsWith('/api/') ? endpoint : `/api/${endpoint}`;
  
  // Use absolute URL to bypass locale routing
  const url = `${window.location.origin}${apiEndpoint}`;
  
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (endpoint: string, options?: Omit<ApiRequestInit, 'method'>) =>
    apiRequest(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint: string, data?: any, options?: Omit<ApiRequestInit, 'method' | 'body'>) =>
    apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  put: (endpoint: string, data?: any, options?: Omit<ApiRequestInit, 'method' | 'body'>) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  delete: (endpoint: string, options?: Omit<ApiRequestInit, 'method'>) =>
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
  
  patch: (endpoint: string, data?: any, options?: Omit<ApiRequestInit, 'method' | 'body'>) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
};