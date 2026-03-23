import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCheck, X } from 'lucide-react';

/**
 * Banner that appears when the user selects all rows on the current page,
 * offering to expand the selection to ALL filtered results across all pages.
 */
export default function SelectAllFilteredBanner({
  pageSelectedCount,
  pageTotal,
  filteredTotal,
  selectionScope,     // 'page' | 'filtered'
  onSelectAllFiltered,
  onClearToPage,
}) {
  // Only show when user selected the whole current page AND there are more filtered results
  if (pageSelectedCount < pageTotal || filteredTotal <= pageTotal) return null;

  if (selectionScope === 'filtered') {
    return (
      <div className="flex items-center justify-center gap-3 py-2 px-4 rounded-lg text-sm bg-[#7DB04B]/5 border border-[#7DB04B]/20">
        <CheckCheck className="w-4 h-4 text-[#7DB04B]" />
        <span className="text-foreground">
          Todos os <strong>{filteredTotal}</strong> usuários filtrados estão selecionados.
        </span>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-[#7DB04B] underline"
          onClick={onClearToPage}
        >
          Selecionar apenas esta página
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 py-2 px-4 rounded-lg text-sm bg-muted/60 border">
      <span className="text-foreground">
        Todos os <strong>{pageTotal}</strong> desta página estão selecionados.
      </span>
      <Button
        variant="link"
        size="sm"
        className="h-auto p-0 text-[#7DB04B] underline font-semibold"
        onClick={onSelectAllFiltered}
      >
        Selecionar todos os {filteredTotal} resultados filtrados
      </Button>
    </div>
  );
}