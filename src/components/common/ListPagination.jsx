import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

export function useListPagination(filteredItems) {
  const [currentPage, setCurrentPage] = React.useState(1);

  // Reset to page 1 when filters change
  const prevLenRef = React.useRef(filteredItems.length);
  React.useEffect(() => {
    if (filteredItems.length !== prevLenRef.current) {
      setCurrentPage(1);
      prevLenRef.current = filteredItems.length;
    }
  }, [filteredItems.length]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  return { paginatedItems, currentPage: safeCurrentPage, totalPages, setCurrentPage, totalItems: filteredItems.length };
}

export default function ListPagination({ currentPage, totalPages, totalItems, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages} ({totalItems} itens)
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="min-h-[44px]"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="min-h-[44px]"
        >
          Próximo
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}