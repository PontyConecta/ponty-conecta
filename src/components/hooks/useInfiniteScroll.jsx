import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para carregamento infinito (infinite scroll)
 * Carrega dados conforme usuário rola a página
 */
export function useInfiniteScroll(fetchMore, hasMore) {
  const [isFetching, setIsFetching] = useState(false);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !isFetching) {
      setIsFetching(true);
      fetchMore().finally(() => {
        setIsFetching(false);
      });
    }
  }, [fetchMore, hasMore, isFetching]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const option = {
      root: null,
      rootMargin: '100px',
      threshold: 0
    };

    observerRef.current = new IntersectionObserver(handleObserver, option);
    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  return { loadMoreRef, isFetching };
}