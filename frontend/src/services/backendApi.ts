/**
 * Backend API Client
 * Handles all communication with the backend API
 */

import { apiRequest, ApiError } from './apiClient';

// Backend API URL - set during build or defaults to same origin
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Make a POST request to the backend API
 */
export async function backendPost<T>(endpoint: string, body: object): Promise<T> {
  const response = await apiRequest(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    timeout: 60000,
  });

  const data = await response.json();
  
  if (data.error) {
    throw {
      code: data.error.code || 'API_ERROR',
      message: data.error.message || 'API request failed',
      retryable: data.error.retryable ?? true,
    } as ApiError;
  }

  return data as T;
}

/**
 * Make a GET request to the backend API
 */
export async function backendGet<T>(endpoint: string): Promise<T> {
  const response = await apiRequest(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  const data = await response.json();
  
  if (data.error) {
    throw {
      code: data.error.code || 'API_ERROR',
      message: data.error.message || 'API request failed',
      retryable: data.error.retryable ?? true,
    } as ApiError;
  }

  return data as T;
}
