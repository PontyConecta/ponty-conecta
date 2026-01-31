import { useState, useCallback } from 'react';

/**
 * Hook para paginação de listas
 * Reduz carregamento inicial e melhora performance
 */
export function usePagination(initialPageSize = 20) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const paginate = useCallback((items) => {
    if (!items || items.length === 0) return [];
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }, [currentPage, pageSize]);

  const totalPages = useCallback((totalItems) => {
    return Math.ceil(totalItems / pageSize);
  }, [pageSize]);

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    pageSize,
    setPageSize,
    paginate,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    reset
  };
}