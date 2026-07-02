import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export type BackendStatus = 'checking' | 'connected' | 'offline';

export function useBackendStatus(intervalMs = 30_000): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>('checking');

  const check = useCallback(async () => {
    try {
      await api.healthCheck();
      setStatus('connected');
    } catch {
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, intervalMs);
    return () => clearInterval(id);
  }, [check, intervalMs]);

  return status;
}
