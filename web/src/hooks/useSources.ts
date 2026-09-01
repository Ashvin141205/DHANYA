/**
 * Dhanya Authoritative Sources Registry Domain Hook
 * Application: web
 * 
 * Fetches verified statutory provenance records from the backend API.
 * Provides mutation capabilities for source re-verification and audit.
 */

import { useState, useEffect, useCallback } from 'react';
import { SourceProvenance, ApiSuccessResponse } from '@dhanya/types';
import { apiClient, ApiError } from '../services/apiClient';

export interface UseSourcesResult {
  sources: SourceProvenance[];
  loading: boolean;
  error: string | null;
  isLive: boolean;
  refetch: () => Promise<void>;
  verifySource: (
    id: string,
    status?: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED' | 'DEPRECATED'
  ) => Promise<SourceProvenance | null>;
}

export function useSources(autoFetch: boolean = true): UseSourcesResult {
  const [sources, setSources] = useState<SourceProvenance[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<ApiSuccessResponse<SourceProvenance[]>>('/api/v1/sources');
      if (response && response.status === 'success' && Array.isArray(response.data)) {
        setSources(response.data);
        setIsLive(true);
      } else {
        setSources([]);
        setIsLive(true);
      }
    } catch (err: any) {
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message || 'Unable to connect to Authoritative Sources service.';
      setError(message);
      setIsLive(false);
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifySource = async (
    id: string,
    status: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED' | 'DEPRECATED' = 'VERIFIED'
  ): Promise<SourceProvenance | null> => {
    try {
      const response = await apiClient.post<ApiSuccessResponse<SourceProvenance>>(
        `/api/v1/sources/${id}/verify`,
        { status }
      );
      if (response && response.status === 'success' && response.data) {
        setSources((prev) =>
          prev.map((s) => (s.id === id ? response.data : s))
        );
        return response.data;
      }
      return null;
    } catch (err: any) {
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message || 'Failed to verify source.';
      setError(message);
      throw err;
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchSources();
    }
  }, [fetchSources, autoFetch]);

  return {
    sources,
    loading,
    error,
    isLive,
    refetch: fetchSources,
    verifySource,
  };
}
