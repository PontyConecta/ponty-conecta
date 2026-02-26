import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchFilter from '../common/SearchFilter';

export default function DeliveriesFilters({
  profileType,
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <SearchFilter
            value={searchTerm}
            onChange={onSearchChange}
            placeholder={profileType === 'brand' ? "Buscar por criador ou campanha..." : "Buscar por campanha ou marca..."}
            className="flex-1"
          />
          <Select value={filterStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="pending">Aguardando</SelectItem>
              <SelectItem value="submitted">Enviadas</SelectItem>
              <SelectItem value="approved">Aprovadas</SelectItem>
              <SelectItem value="contested">Contestadas</SelectItem>
              <SelectItem value="in_dispute">Em Disputa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}