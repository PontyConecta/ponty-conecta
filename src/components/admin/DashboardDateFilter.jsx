import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CalendarDays, CalendarRange, Settings2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ranges = [
  { key: 'day', label: 'Hoje', icon: Clock },
  { key: 'week', label: '7 dias', icon: Calendar },
  { key: 'month', label: '30 dias', icon: CalendarDays },
  { key: 'year', label: '12 meses', icon: CalendarRange },
];

export default function DashboardDateFilter({ value, onChange }) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const isCustom = typeof value === 'object' && value?.type === 'custom';

  const handleApplyCustom = () => {
    if (!customFrom || !customTo) return;
    onChange({ type: 'custom', from: customFrom, to: customTo });
    setCustomOpen(false);
  };

  const customLabel = isCustom
    ? `${new Date(value.from).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${new Date(value.to).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
    : 'Personalizado';

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg w-fit flex-wrap bg-muted">
      {ranges.map(r => {
        const active = value === r.key;
        return (
          <Button
            key={r.key}
            variant="ghost"
            size="sm"
            onClick={() => onChange(r.key)}
            className={`h-8 px-3 gap-1.5 text-xs font-medium rounded-md transition-all ${
              active ? 'shadow-sm' : 'opacity-60 hover:opacity-100'
            }`}
            style={active ? { backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--primary))' } : { color: 'hsl(var(--muted-foreground))' }}
          >
            <r.icon className="w-3.5 h-3.5" />
            {r.label}
          </Button>
        );
      })}

      {/* Custom date range */}
      <Popover open={customOpen} onOpenChange={setCustomOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-3 gap-1.5 text-xs font-medium rounded-md transition-all ${
              isCustom ? 'shadow-sm' : 'opacity-60 hover:opacity-100'
            }`}
            style={isCustom ? { backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--primary))' } : { color: 'hsl(var(--muted-foreground))' }}
          >
            <Settings2 className="w-3.5 h-3.5" />
            {customLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="end" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground">Período Personalizado</p>
            <div className="space-y-2">
              <div>
                <Label className="text-[11px] text-muted-foreground">De</Label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-8 text-xs mt-1"
                  style={{ color: 'hsl(var(--foreground))', backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Até</Label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-8 text-xs mt-1"
                  max={new Date().toISOString().split('T')[0]}
                  style={{ color: 'hsl(var(--foreground))', backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                />
              </div>
            </div>
            <Button
              onClick={handleApplyCustom}
              disabled={!customFrom || !customTo}
              size="sm"
              className="w-full h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}