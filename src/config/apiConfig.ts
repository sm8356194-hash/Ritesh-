/**
 * Frontend API Configuration Module
 * Provides centralized API endpoint resolution and environment helpers.
 */

export const getApiBaseUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/api`;
  }
  // Node.js test runner / CLI execution fallback
  if (typeof process !== 'undefined' && process.env) {
    const port = process.env.PORT || '3000';
    const appUrl = process.env.APP_URL;
    if (appUrl) {
      return `${appUrl.replace(/\/+$/, '')}/api`;
    }
    return `http://localhost:${port}/api`;
  }
  return '/api';
};

export const getAppEnvironment = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development';
  }
  return process.env.NODE_ENV || 'development';
};

export const isProductionEnvironment = (): boolean => {
  return getAppEnvironment() === 'production';
};

export const fetchApi = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const baseUrl = getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string> || {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.error) errorMessage = parsed.error;
      } catch {
        if (errorText) errorMessage = errorText;
      }
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network request failed',
    };
  }
};
