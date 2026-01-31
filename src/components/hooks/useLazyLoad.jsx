import { useState, useCallback } from 'react';

/**
 * Hook para carregamento sob demanda (lazy loading)
 * Carrega dados apenas quando necessário
 */
export function useLazyLoad(fetchFunction) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newData = await fetchFunction(page, PAGE_SIZE);
      
      if (newData.length < PAGE_SIZE) {
        setHasMore(false);
      }
      
      setData(prev => [...prev, ...newData]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, loading, hasMore, page]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
  }, []);

  return {
    data,
    loading,
    hasMore,
    loadMore,
    reset
  };
}