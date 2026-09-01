/**
 * Dhanya Centralized Authenticated API Client
 * Application: web
 * 
 * Provides unified HTTP communication to /api/v1 endpoints with:
 * - Automatic Authorization: Bearer <token> injection
 * - 401 Unauthorized handling & session invalidation callback
 * - 403 Forbidden structured error normalization
 * - Unified JSON error parsing
 */

import { tokenStorage } from '../auth/tokenStorage';

export interface ApiErrorDetails {
  status: number;
  code?: string;
  message: string;
  details?: Record<string, string>;
}

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: Record<string, string>;

  constructor(status: number, message: string, code?: string, details?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type UnauthorizedHandler = () => void;

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

class ApiClient {
  private unauthorizedHandlers: Set<UnauthorizedHandler> = new Set();
  public defaultTimeoutMs: number = 10000;

  public onUnauthorized(handler: UnauthorizedHandler): () => void {
    this.unauthorizedHandlers.add(handler);
    return () => {
      this.unauthorizedHandlers.delete(handler);
    };
  }

  private notifyUnauthorized(): void {
    tokenStorage.clearSession();
    this.unauthorizedHandlers.forEach((handler) => {
      try {
        handler();
      } catch (err) {
        console.error('Error in unauthorized handler:', err);
      }
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const token = tokenStorage.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : endpoint;

    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });
    } catch (networkError: any) {
      clearTimeout(timer);
      if (networkError.name === 'AbortError' || controller.signal.aborted) {
        throw new ApiError(
          0,
          `Request to ${endpoint} timed out after ${timeoutMs}ms`,
          'REQUEST_TIMEOUT'
        );
      }
      throw new ApiError(0, networkError.message || 'Network request failed. Is the server running?');
    } finally {
      clearTimeout(timer);
    }

    // Handle 401 Unauthorized
    if (response.status === 401) {
      this.notifyUnauthorized();
      let errorBody: any;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { error: 'Authentication session expired or invalid.' };
      }
      throw new ApiError(401, errorBody.error || 'Authentication required.', errorBody.code, errorBody.details);
    }

    // Handle other HTTP errors
    if (!response.ok) {
      let errorBody: any;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { error: `HTTP ${response.status} ${response.statusText}` };
      }
      throw new ApiError(
        response.status,
        errorBody.error || errorBody.message || 'API request failed.',
        errorBody.code,
        errorBody.details
      );
    }

    // Handle successful responses
    if (response.status === 204) {
      return {} as T;
    }

    try {
      return (await response.json()) as T;
    } catch {
      return {} as T;
    }
  }

  public async get<T>(endpoint: string, headers?: Record<string, string>, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET', headers });
  }

  public async post<T>(endpoint: string, body?: any, headers?: Record<string, string>, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public async patch<T>(endpoint: string, body?: any, headers?: Record<string, string>, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public async delete<T>(endpoint: string, headers?: Record<string, string>, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();
