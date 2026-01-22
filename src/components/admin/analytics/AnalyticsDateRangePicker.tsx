import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DateRange } from '@/hooks/admin/useAnalyticsData';

interface AnalyticsDateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const ranges: { value: DateRange; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '14d', label: '14d' },
  { value: '30d', label: '30d' },
];

export function AnalyticsDateRangePicker({ value, onChange }: AnalyticsDateRangePickerProps) {
  return (
    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
      {ranges.map((range) => (
        <Button
          key={range.value}
          variant="ghost"
          size="sm"
          onClick={() => onChange(range.value)}
          className={cn(
            "px-3 py-1.5 h-auto text-xs font-medium transition-all",
            value === range.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
