/**
 * Dhanya Intelligence Feed Domain Hook
 * Application: web
 * 
 * Fetches verified intelligence and regulatory bulletins from the backend API.
 * Guarantees real data flow, loading states, and error handling without static fallbacks.
 */

import { useState, useEffect, useCallback } from 'react';
import { WhatChangedEvent, ApiSuccessResponse } from '@dhanya/types';
import { apiClient, ApiError } from '../services/apiClient';

export interface UseIntelligenceOptions {
  countryCode?: string;
  category?: string;
  autoFetch?: boolean;
}

export interface UseIntelligenceResult {
  events: WhatChangedEvent[];
  loading: boolean;
  error: string | null;
  isLive: boolean;
  refetch: () => Promise<void>;
}

export function useIntelligence(options: UseIntelligenceOptions = {}): UseIntelligenceResult {
  const { countryCode, category, autoFetch = true } = options;
  const [events, setEvents] = useState<WhatChangedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (countryCode && countryCode !== 'ALL') {
      queryParams.append('country', countryCode);
    }
    if (category && category !== 'ALL') {
      queryParams.append('category', category);
    }

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/intelligence${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await apiClient.get<ApiSuccessResponse<WhatChangedEvent[]>>(endpoint);
      if (response && response.status === 'success' && Array.isArray(response.data)) {
        setEvents(response.data);
        setIsLive(true);
      } else {
        setEvents([]);
        setIsLive(true);
      }
    } catch (err: any) {
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message || 'Unable to connect to Intelligence Feed service.';
      setError(message);
      setIsLive(false);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [countryCode, category]);

  useEffect(() => {
    if (autoFetch) {
      fetchEvents();
    }
  }, [fetchEvents, autoFetch]);

  return {
    events,
    loading,
    error,
    isLive,
    refetch: fetchEvents,
  };
}
