import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UserFilters({ searchTerm, onSearchChange, roleFilter, onRoleChange, statusFilter, onStatusChange }) {
  return (
    <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <Input
              placeholder="Buscar por email, nome ou empresa..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
              style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
            />
          </div>
          <Select value={roleFilter} onValueChange={onRoleChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="brand">Marcas</SelectItem>
              <SelectItem value="creator">Criadores</SelectItem>
              <SelectItem value="unknown">Sem Perfil</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="legacy">Legacy</SelectItem>
              <SelectItem value="verified">Verificados</SelectItem>
              <SelectItem value="ready">Conta Pronta</SelectItem>
              <SelectItem value="incomplete">Conta Incompleta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}