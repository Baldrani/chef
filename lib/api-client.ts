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
  let apiEndpoint = endpoint.startsWith('/api/') ? endpoint : `/api/${endpoint}`;
  
  // For client-side requests, always use absolute URL to bypass locale routing
  if (typeof window !== 'undefined') {
    // Get the current origin and construct absolute URL
    const origin = window.location.origin;
    const finalUrl = `${origin}${apiEndpoint}`;
    
    console.log('API Request:', { endpoint, apiEndpoint, origin, finalUrl });
    
    return fetch(finalUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
  }
  
  // Server-side fallback
  return fetch(apiEndpoint, {
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