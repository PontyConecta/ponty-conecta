import React from 'react';
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from 'lucide-react';

export default function OpportunityFilters({
  searchTerm,
  onSearchChange,
  filterPlatform,
  onPlatformChange,
  filterRemuneration,
  onRemunerationChange,
}) {
  return (
    <Card className="border bg-card shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por título ou descrição..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            <Select value={filterPlatform} onValueChange={onPlatformChange}>
              <SelectTrigger className="w-32 flex-shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Plataforma</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="YouTube">YouTube</SelectItem>
                <SelectItem value="Twitter/X">Twitter/X</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRemuneration} onValueChange={onRemunerationChange}>
              <SelectTrigger className="w-32 flex-shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Pagamento</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="barter">Permuta</SelectItem>
                <SelectItem value="mixed">Misto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}