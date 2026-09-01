/**
 * Dhanya Centralized Frontend Authentication Context
 * Application: web
 * 
 * Provides:
 * - Session restoration on mount
 * - DevAuthProvider identity selection
 * - Custom email login
 * - Safe token lifecycle management
 * - Centralized logout with state cleanup
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, UserRole } from '@dhanya/types';
import { tokenStorage } from '../auth/tokenStorage';
import { apiClient, ApiError } from '../services/apiClient';

export interface DevUserOption {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  countryCode?: string;
  createdAt?: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  isRestoringSession: boolean;
  authError: string | null;
  availableDevUsers: DevUserOption[];
  isDevAuthAvailable: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginWithDevUser: (devUser: DevUserOption) => Promise<boolean>;
  loginWithCustom: (email: string, countryCode?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => tokenStorage.getUser());
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [availableDevUsers, setAvailableDevUsers] = useState<DevUserOption[]>([]);
  const [isDevAuthAvailable, setIsDevAuthAvailable] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const isAuthenticated = Boolean(currentUser && tokenStorage.getToken());
  const role = currentUser?.role || null;

  // Listen to 401 Unauthorized events from apiClient
  useEffect(() => {
    const unsubscribe = apiClient.onUnauthorized(() => {
      setCurrentUser(null);
      setAuthError('Your session has expired or the token was invalidated. Please sign in again.');
    });
    return unsubscribe;
  }, []);

  // Fetch Dev Users for Development Auth Picker (Gated on server)
  const fetchDevUsers = useCallback(async () => {
    try {
      const res = await apiClient.get<{ status: string; data: DevUserOption[] }>('/api/v1/auth/dev-users');
      if (res?.status === 'success' && Array.isArray(res.data)) {
        setAvailableDevUsers(res.data);
        setIsDevAuthAvailable(true);
        return;
      }
      setIsDevAuthAvailable(false);
      setAvailableDevUsers([]);
    } catch {
      setIsDevAuthAvailable(false);
      setAvailableDevUsers([]);
    }
  }, []);

  // Session Restoration on Page Load
  const restoreSession = useCallback(async () => {
    setIsRestoringSession(true);
    const token = tokenStorage.getToken();

    if (!token) {
      setCurrentUser(null);
      setIsRestoringSession(false);
      return;
    }

    try {
      const response = await apiClient.get<{ status: string; data: { user: AuthUser } }>('/api/v1/auth/me');
      if (response?.status === 'success' && response.data?.user) {
        setCurrentUser(response.data.user);
        tokenStorage.setSession(token, response.data.user);
        setAuthError(null);
      } else {
        tokenStorage.clearSession();
        setCurrentUser(null);
      }
    } catch (err: any) {
      // 401 or invalid token
      console.warn('Session restoration failed:', err.message);
      tokenStorage.clearSession();
      setCurrentUser(null);
    } finally {
      setIsRestoringSession(false);
    }
  }, []);

  useEffect(() => {
    fetchDevUsers();
    restoreSession();
  }, [fetchDevUsers, restoreSession]);

  // Login with Dev Persona via POST /auth/dev-login
  const loginWithDevUser = async (devUser: DevUserOption): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await apiClient.post<{
        status: string;
        data: { token: string; user: AuthUser; expiresAt: string };
      }>('/api/v1/auth/dev-login', {
        devUserId: devUser.id,
      });

      if (res?.status === 'success' && res.data) {
        tokenStorage.setSession(res.data.token, res.data.user, res.data.expiresAt);
        setCurrentUser(res.data.user);
        setIsAuthModalOpen(false);
        return true;
      }

      throw new Error('Could not authenticate dev persona.');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to authenticate dev persona.');
      return false;
    }
  };

  // Login with custom email (Server-authoritative role assignment)
  const loginWithCustom = async (email: string, countryCodeInput = 'US'): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await apiClient.post<{
        status: string;
        data: { token: string; user: AuthUser; expiresAt: string };
      }>('/api/v1/auth/login', {
        email,
        countryCode: countryCodeInput,
      });

      if (res?.status === 'success' && res.data) {
        tokenStorage.setSession(res.data.token, res.data.user, res.data.expiresAt);
        setCurrentUser(res.data.user);
        setIsAuthModalOpen(false);
        return true;
      }
      throw new Error('Unexpected response format from auth service.');
    } catch (err: any) {
      if (err instanceof ApiError && err.details) {
        const detailMsg = Object.values(err.details).join(', ');
        setAuthError(`${err.message} (${detailMsg})`);
      } else {
        setAuthError(err.message || 'Authentication request failed.');
      }
      return false;
    }
  };

  // Centralized Logout
  const logout = async (): Promise<void> => {
    try {
      // Notify backend to record audit logout event
      await apiClient.post('/api/v1/auth/logout');
    } catch (e) {
      // ignore network errors on logout
    } finally {
      tokenStorage.clearSession();
      setCurrentUser(null);
      setAuthError(null);
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        role,
        isRestoringSession,
        authError,
        availableDevUsers,
        isDevAuthAvailable,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithDevUser,
        loginWithCustom,
        logout,
        clearAuthError,
        refreshSession: restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
