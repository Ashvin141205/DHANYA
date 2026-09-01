/**
 * Dhanya Centralized Admin API Client
 * Application: admin
 * 
 * Provides unified, typed HTTP communication to /api/v1 endpoints with:
 * - Bearer authorization header injection from session storage
 * - Timeout handling via AbortController (default 10s)
 * - 401 Unauthorized handling & session clearing
 * - 403 Forbidden structured error normalization
 * - Unified JSON error parsing
 */

import {
  VersionedFinancialRule,
  SourceProvenance,
  AuditLogEntry,
  AuthUser,
  UserRole,
  UserStatus,
  WhatChangedEvent,
} from '@dhanya/types';

export class AdminApiError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(status: number, message: string, code?: string, details?: any) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface AdminRequestOptions extends RequestInit {
  timeoutMs?: number;
}

type UnauthorizedHandler = () => void;

class AdminApiClient {
  private unauthorizedHandlers: Set<UnauthorizedHandler> = new Set();
  public defaultTimeoutMs: number = 10000;

  public onUnauthorized(handler: UnauthorizedHandler): () => void {
    this.unauthorizedHandlers.add(handler);
    return () => {
      this.unauthorizedHandlers.delete(handler);
    };
  }

  private notifyUnauthorized(): void {
    sessionStorage.removeItem('dhanya_admin_token');
    localStorage.removeItem('dhanya_admin_token');
    localStorage.removeItem('dhanya_auth_token');
    this.unauthorizedHandlers.forEach((handler) => {
      try {
        handler();
      } catch (err) {
        console.error('Error in admin unauthorized handler:', err);
      }
    });
  }

  public getToken(): string {
    return (
      sessionStorage.getItem('dhanya_auth_token_v1') ||
      localStorage.getItem('dhanya_auth_token_v1') ||
      sessionStorage.getItem('dhanya_admin_token') ||
      localStorage.getItem('dhanya_admin_token') ||
      localStorage.getItem('dhanya_auth_token') ||
      ''
    );
  }

  public setToken(token: string): void {
    sessionStorage.setItem('dhanya_admin_token', token);
    sessionStorage.setItem('dhanya_auth_token_v1', token);
    localStorage.setItem('dhanya_admin_token', token);
    localStorage.setItem('dhanya_auth_token_v1', token);
    localStorage.setItem('dhanya_auth_token', token);
  }

  public clearToken(): void {
    sessionStorage.removeItem('dhanya_admin_token');
    sessionStorage.removeItem('dhanya_auth_token_v1');
    localStorage.removeItem('dhanya_admin_token');
    localStorage.removeItem('dhanya_auth_token_v1');
    localStorage.removeItem('dhanya_auth_token');
  }

  public async request<T>(
    endpoint: string,
    options: AdminRequestOptions = {}
  ): Promise<T> {
    const token = this.getToken();
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
        throw new AdminApiError(
          0,
          `Request to ${endpoint} timed out after ${timeoutMs}ms`,
          'REQUEST_TIMEOUT'
        );
      }
      throw new AdminApiError(0, networkError.message || 'Network request failed. Is the server running?');
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 401) {
      this.notifyUnauthorized();
      let errorBody: any;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { error: 'Admin authentication session expired or invalid.' };
      }
      throw new AdminApiError(
        401,
        errorBody.error || errorBody.message || 'Authentication required.',
        errorBody.code,
        errorBody.details
      );
    }

    if (!response.ok) {
      let errorBody: any;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { error: `HTTP ${response.status} ${response.statusText}` };
      }
      throw new AdminApiError(
        response.status,
        errorBody.error || errorBody.message || 'Admin API request failed.',
        errorBody.code,
        errorBody.details
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    try {
      return (await response.json()) as T;
    } catch {
      return {} as T;
    }
  }

  public async get<T>(endpoint: string, headers?: Record<string, string>, options?: AdminRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET', headers });
  }

  public async post<T>(endpoint: string, body?: any, headers?: Record<string, string>, options?: AdminRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public async patch<T>(endpoint: string, body?: any, headers?: Record<string, string>, options?: AdminRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public async delete<T>(endpoint: string, headers?: Record<string, string>, options?: AdminRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE', headers });
  }

  // --- Typed Domain Operations ---

  public async getDevUsers(): Promise<Array<{ id: string; name: string; email: string; role: UserRole }>> {
    const res = await this.get<{ status: string; data: Array<{ id: string; name: string; email: string; role: UserRole }> }>(
      '/api/v1/auth/dev-users'
    );
    return res?.data || [];
  }

  public async devLogin(devUserId: string): Promise<{ token: string; user: AuthUser } | null> {
    const res = await this.post<{ status: string; data: { token: string; user: AuthUser } }>(
      '/api/v1/auth/dev-login',
      { devUserId }
    );
    if (res?.status === 'success' && res.data) {
      this.setToken(res.data.token);
      return res.data;
    }
    return null;
  }

  public async login(email: string): Promise<{ token: string; user: AuthUser } | null> {
    const res = await this.post<{ status: string; data: { token: string; user: AuthUser } }>(
      '/api/v1/auth/login',
      { email }
    );
    if (res?.status === 'success' && res.data) {
      this.setToken(res.data.token);
      return res.data;
    }
    return null;
  }

  public async getCurrentUser(): Promise<AuthUser | null> {
    const res = await this.get<{ status: string; data: { user: AuthUser } }>('/api/v1/auth/me');
    return res?.data?.user || null;
  }

  public async logout(): Promise<void> {
    try {
      await this.post('/api/v1/auth/logout');
    } finally {
      this.clearToken();
    }
  }

  public async getRules(): Promise<{ status: string; data: VersionedFinancialRule[] }> {
    return this.get<{ status: string; data: VersionedFinancialRule[] }>('/api/v1/rules');
  }

  public async createRule(payload: Partial<VersionedFinancialRule>): Promise<{ status: string; data: VersionedFinancialRule }> {
    return this.post<{ status: string; data: VersionedFinancialRule }>('/api/v1/rules', payload);
  }

  public async getSources(): Promise<{ status: string; data: SourceProvenance[] }> {
    return this.get<{ status: string; data: SourceProvenance[] }>('/api/v1/sources');
  }

  public async verifySource(sourceId: string, status: 'VERIFIED' | 'FLAGGED'): Promise<{ status: string; data: SourceProvenance }> {
    return this.post<{ status: string; data: SourceProvenance }>(`/api/v1/sources/${sourceId}/verify`, { status });
  }

  public async publishIntelligence(payload: Partial<WhatChangedEvent>): Promise<{ status: string; data: WhatChangedEvent }> {
    return this.post<{ status: string; data: WhatChangedEvent }>('/api/v1/intelligence', payload);
  }

  public async getAuditLogs(): Promise<{
    status: string;
    count: number;
    integrity?: { hashChainVerified: boolean; latestHash: string };
    data: AuditLogEntry[];
  }> {
    return this.get<{
      status: string;
      count: number;
      integrity?: { hashChainVerified: boolean; latestHash: string };
      data: AuditLogEntry[];
    }>('/api/v1/admin/audit-logs');
  }

  public async verifyAuditIntegrity(): Promise<{
    status: string;
    data: { valid: boolean; message: string; verifiedCount: number };
  }> {
    return this.get<{
      status: string;
      data: { valid: boolean; message: string; verifiedCount: number };
    }>('/api/v1/admin/audit-logs/verify-integrity');
  }

  public async getHealth(): Promise<{
    status: string;
    persistence: {
      adapter: string;
      isDurable: boolean;
      totalLoans: number;
      totalRules: number;
      totalSources: number;
      totalUsers: number;
      uptimeSeconds: number;
    };
  }> {
    return this.get<{
      status: string;
      persistence: {
        adapter: string;
        isDurable: boolean;
        totalLoans: number;
        totalRules: number;
        totalSources: number;
        totalUsers: number;
        uptimeSeconds: number;
      };
    }>('/api/v1/admin/health');
  }

  public async getUsers(): Promise<{ status: string; count: number; data: AuthUser[] }> {
    return this.get<{ status: string; count: number; data: AuthUser[] }>('/api/v1/admin/users');
  }

  public async updateUserStatus(userId: string, status: UserStatus): Promise<{ status: string; data: AuthUser }> {
    return this.patch<{ status: string; data: AuthUser }>(`/api/v1/admin/users/${userId}/status`, { status });
  }
}

export const adminApiClient = new AdminApiClient();
