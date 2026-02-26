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

export default function ApplicationsFilters({
  profileType,
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterCampaign,
  onCampaignChange,
  campaignList,
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
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pending">{profileType === 'brand' ? 'Pendentes' : 'Aguardando'}</SelectItem>
                <SelectItem value="accepted">Aceitas</SelectItem>
                <SelectItem value="rejected">Recusadas</SelectItem>
                {profileType === 'creator' && <SelectItem value="withdrawn">Canceladas</SelectItem>}
              </SelectContent>
            </Select>
            {profileType === 'brand' && (
              <Select value={filterCampaign} onValueChange={onCampaignChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Campanha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Campanhas</SelectItem>
                  {campaignList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}