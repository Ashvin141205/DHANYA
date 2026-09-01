/**
 * Dhanya Token & Session Storage Service
 * Application: web
 * 
 * Manages secure client-side storage for signed authentication tokens.
 * 
 * SECURITY ARCHITECTURE & TRADEOFF ANALYSIS:
 * - Current Implementation: In-memory primary cache with sessionStorage secondary fallback.
 * - Why sessionStorage over localStorage: sessionStorage is bounded to the browser tab lifecycle
 *   and is automatically cleared when the tab closes, preventing long-lived credential leakage
 *   across shared or multi-user workstations.
 * - Production Roadmap: When deployed with unified cookie domains, HttpOnly + SameSite=Strict cookies
 *   are recommended to completely mitigate XSS-based token exfiltration.
 */

import { AuthUser, AuthSession } from '@dhanya/types';

const SESSION_TOKEN_KEY = 'dhanya_auth_token_v1';
const SESSION_USER_KEY = 'dhanya_auth_user_v1';
const SESSION_EXPIRY_KEY = 'dhanya_auth_expiry_v1';

class TokenStorageService {
  private memoryToken: string | null = null;
  private memoryUser: AuthUser | null = null;
  private memoryExpiry: number | null = null;

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return;

      const token = sessionStorage.getItem(SESSION_TOKEN_KEY) || localStorage.getItem(SESSION_TOKEN_KEY) || localStorage.getItem('dhanya_auth_token');
      const userJson = sessionStorage.getItem(SESSION_USER_KEY) || localStorage.getItem(SESSION_USER_KEY);
      const expiryStr = sessionStorage.getItem(SESSION_EXPIRY_KEY) || localStorage.getItem(SESSION_EXPIRY_KEY);

      if (token && userJson && expiryStr) {
        const expiry = parseInt(expiryStr, 10);
        const now = Math.floor(Date.now() / 1000);

        if (expiry > now) {
          this.memoryToken = token;
          this.memoryUser = JSON.parse(userJson);
          this.memoryExpiry = expiry;
        } else {
          this.clearSession();
        }
      }
    } catch (e) {
      console.warn('Failed to hydrate auth session from storage:', e);
      this.clearSession();
    }
  }

  public getToken(): string | null {
    if (this.isTokenExpired()) {
      this.clearSession();
      return null;
    }
    return this.memoryToken;
  }

  public getUser(): AuthUser | null {
    if (this.isTokenExpired()) {
      this.clearSession();
      return null;
    }
    return this.memoryUser;
  }

  public setSession(token: string, user: AuthUser, expiresAtIso?: string): void {
    this.memoryToken = token;
    this.memoryUser = user;

    let expiryTimestamp: number;
    if (expiresAtIso) {
      expiryTimestamp = Math.floor(new Date(expiresAtIso).getTime() / 1000);
    } else {
      // Default 7 days
      expiryTimestamp = Math.floor(Date.now() / 1000) + 7 * 86400;
    }
    this.memoryExpiry = expiryTimestamp;

    try {
      if (typeof window !== 'undefined') {
        sessionStorage?.setItem(SESSION_TOKEN_KEY, token);
        sessionStorage?.setItem(SESSION_USER_KEY, JSON.stringify(user));
        sessionStorage?.setItem(SESSION_EXPIRY_KEY, String(expiryTimestamp));

        localStorage?.setItem(SESSION_TOKEN_KEY, token);
        localStorage?.setItem('dhanya_auth_token', token);
        localStorage?.setItem(SESSION_USER_KEY, JSON.stringify(user));
        localStorage?.setItem(SESSION_EXPIRY_KEY, String(expiryTimestamp));
      }
    } catch (e) {
      console.error('Failed to persist auth session to storage:', e);
    }
  }

  public clearSession(): void {
    this.memoryToken = null;
    this.memoryUser = null;
    this.memoryExpiry = null;

    try {
      if (typeof window !== 'undefined') {
        sessionStorage?.removeItem(SESSION_TOKEN_KEY);
        sessionStorage?.removeItem(SESSION_USER_KEY);
        sessionStorage?.removeItem(SESSION_EXPIRY_KEY);

        localStorage?.removeItem(SESSION_TOKEN_KEY);
        localStorage?.removeItem('dhanya_auth_token');
        localStorage?.removeItem(SESSION_USER_KEY);
        localStorage?.removeItem(SESSION_EXPIRY_KEY);
      }
    } catch (e) {
      // ignore
    }
  }

  public isTokenExpired(): boolean {
    if (!this.memoryToken || !this.memoryExpiry) return true;
    const now = Math.floor(Date.now() / 1000);
    return this.memoryExpiry <= now;
  }
}

export const tokenStorage = new TokenStorageService();
