import { useState, useCallback } from 'react';

/**
 * Generic hook for async API calls with loading/error state.
 * Usage: const { execute, loading, error } = useApi(myServiceFn);
 */
export const useApi = (apiFn) => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [data,    setData]    = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      setData(result);
      return result;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { execute, loading, error, data };
};
