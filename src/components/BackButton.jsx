import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate(-1)}
      className="h-10 w-10 rounded-full hover:bg-purple-500/10"
      style={{ color: 'var(--text-primary)' }}
    >
      <ArrowLeft className="w-5 h-5" />
    </Button>
  );
}