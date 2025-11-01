import React from 'react';
import { Calendar, Clock, Users, MapPin, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, startOfDay, endOfDay, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export type TimeWindow = 'any' | 'morning' | 'afternoon' | 'evening';
export type SortOption = 'soonest' | 'closest' | 'open_seats' | 'newest';

export interface GameFilters {
  date: Date | null; // null = no date filter
  timeWindow: TimeWindow;
  hideFullGames: boolean;
  radiusKm: 5 | 10 | 25;
  sortBy: SortOption;
}

interface GameFiltersBarProps {
  filters: GameFilters;
  onFiltersChange: (filters: GameFilters) => void;
  mode: 'nearby' | 'course';
  className?: string;
}

const TIME_WINDOWS = [
  { value: 'any' as const, label: 'Any Time', hours: null },
  { value: 'morning' as const, label: 'Morning', hours: '06:00–12:00' },
  { value: 'afternoon' as const, label: 'Afternoon', hours: '12:00–18:00' },
  { value: 'evening' as const, label: 'Evening', hours: '18:00–22:00' },
];

const RADIUS_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
];

const SORT_OPTIONS = [
  { value: 'soonest' as const, label: 'Soonest', icon: Clock },
  { value: 'closest' as const, label: 'Closest', icon: MapPin },
  { value: 'open_seats' as const, label: 'Most Slots', icon: Users },
  { value: 'newest' as const, label: 'Newest', icon: ArrowUpDown },
];

export function GameFiltersBar({ filters, onFiltersChange, mode, className }: GameFiltersBarProps) {
  const updateFilter = <K extends keyof GameFilters>(key: K, value: GameFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getDateLabel = () => {
    if (!filters.date) return 'Any Date';
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    
    if (isSameDay(filters.date, today)) return 'Today';
    if (isSameDay(filters.date, tomorrow)) return 'Tomorrow';
    return format(filters.date, 'MMM d');
  };

  const quickSetDate = (days: number | null) => {
    if (days === null) {
      updateFilter('date', null);
    } else {
      updateFilter('date', addDays(startOfDay(new Date()), days));
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Date Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={filters.date ? 'default' : 'outline'}
            size="sm"
            className="h-8 gap-2"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{getDateLabel()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col gap-2 p-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickSetDate(null)}
                className="flex-1"
              >
                Any Date
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickSetDate(0)}
                className="flex-1"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickSetDate(1)}
                className="flex-1"
              >
                Tomorrow
              </Button>
            </div>
            <div className="border-t pt-2">
              <CalendarComponent
                mode="single"
                selected={filters.date || undefined}
                onSelect={(date) => updateFilter('date', date || null)}
                disabled={(date) => date < startOfDay(new Date())}
                initialFocus
                className="pointer-events-auto"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Time Window Filter */}
      <div className="flex gap-1">
        {TIME_WINDOWS.map((tw) => (
          <Button
            key={tw.value}
            variant={filters.timeWindow === tw.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('timeWindow', tw.value)}
            className="h-8 px-3"
          >
            <span className="text-xs font-medium">{tw.label}</span>
          </Button>
        ))}
      </div>

      {/* Hide Full Games Toggle */}
      <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
        <Switch
          id="hide-full"
          checked={filters.hideFullGames}
          onCheckedChange={(checked) => updateFilter('hideFullGames', checked)}
          className="scale-75"
        />
        <Label htmlFor="hide-full" className="text-xs font-medium cursor-pointer">
          Hide Full
        </Label>
      </div>

      {/* Radius Filter (Nearby mode only) */}
      {mode === 'nearby' && (
        <div className="flex gap-1">
          {RADIUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={filters.radiusKm === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('radiusKm', opt.value as 5 | 10 | 25)}
              className="h-8 px-3"
            >
              <MapPin className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs font-medium">{opt.label}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Sort Options */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 ml-auto"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">
              {SORT_OPTIONS.find((s) => s.value === filters.sortBy)?.label}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="end">
          <div className="flex flex-col gap-1">
            {SORT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <Button
                  key={opt.value}
                  variant={filters.sortBy === opt.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => updateFilter('sortBy', opt.value)}
                  className="justify-start gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{opt.label}</span>
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Helper to convert filters to query params
export function getTimeRangeFromFilters(filters: GameFilters): { from: Date; to: Date } | null {
  if (!filters.date) return null;

  const baseDate = filters.date;
  let startHour = 0;
  let endHour = 23;
  let endMinute = 59;

  switch (filters.timeWindow) {
    case 'morning':
      startHour = 6;
      endHour = 11;
      endMinute = 59;
      break;
    case 'afternoon':
      startHour = 12;
      endHour = 17;
      endMinute = 59;
      break;
    case 'evening':
      startHour = 18;
      endHour = 21;
      endMinute = 59;
      break;
    case 'any':
    default:
      // Full day
      break;
  }

  const from = new Date(baseDate);
  from.setHours(startHour, 0, 0, 0);

  const to = new Date(baseDate);
  to.setHours(endHour, endMinute, 59, 999);

  return { from, to };
}
