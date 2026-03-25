import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import useSmartBack from '@/hooks/useSmartBack';

export default function BackButton({ currentPage }) {
  const { goBack, backLabel } = useSmartBack(currentPage);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={goBack}
      className="h-9 gap-1.5 px-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10 -ml-1"
    >
      <ArrowLeft className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm font-medium truncate max-w-[110px] hidden sm:inline">
        {backLabel}
      </span>
    </Button>
  );
}