/**
 * Base HTTP client wrapper
 * Provides consistent error handling and request/response interceptors
 */

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  retryable: boolean;
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 0;

/**
 * Base API client with error handling and retry logic
 */
export async function apiRequest(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw createApiError(response);
    }

    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw {
        code: 'TIMEOUT',
        message: 'Request timed out',
        retryable: true,
      } as ApiError;
    }

    if (retries > 0 && isRetryableError(error)) {
      // Retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * (DEFAULT_RETRIES - retries + 1)));
      return apiRequest(url, { ...options, retries: retries - 1 });
    }

    throw error;
  }
}

/**
 * Create API error from response
 */
async function createApiError(response: Response): Promise<ApiError> {
  let message = `HTTP ${response.status}: ${response.statusText}`;
  
  try {
    const data = await response.json();
    message = data.message || data.error || message;
  } catch {
    // Ignore JSON parse errors
  }

  return {
    code: `HTTP_${response.status}`,
    message,
    status: response.status,
    retryable: response.status >= 500 || response.status === 429,
  };
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  if (error?.retryable !== undefined) {
    return error.retryable;
  }
  
  // Network errors are retryable
  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return true;
  }

  return false;
}

