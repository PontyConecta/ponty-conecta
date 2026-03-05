import React, { useRef } from 'react';
import { ChevronRight } from 'lucide-react';

export default function HorizontalSection({ title, onSeeMore, children }) {
  const scrollRef = useRef(null);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {onSeeMore && (
          <button onClick={onSeeMore} className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
            Ver mais <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div
        ref={scrollRef}
        className="overflow-x-auto flex gap-3 pb-2 scrollbar-hide -mx-1 px-1"
      >
        {children}
      </div>
    </div>
  );
}