import React, { useState } from 'react';
import { Calendar, Clock, MapPin, ChevronsUpDown, ArrowDownWideNarrow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, startOfDay, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export type TimeWindow = 'any' | 'morning' | 'afternoon' | 'evening';
export type SortOption = 'soonest' | 'closest' | 'open_seats' | 'newest';

export interface GameFilters {
  date: Date | null; // null = no date filter
  timeWindow: TimeWindow;
  radiusKm: 5 | 10 | 25;
  sortBy: SortOption;
}

interface GameFiltersBarProps {
  filters: GameFilters;
  onFiltersChange: (filters: GameFilters) => void;
  mode: 'nearby' | 'course';
  className?: string;
  portalContainer?: HTMLElement | null;
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
  { value: 'soonest' as const, label: 'Soonest' },
  { value: 'closest' as const, label: 'Closest' },
  { value: 'open_seats' as const, label: 'Most Slots' },
  { value: 'newest' as const, label: 'Newest' },
];

export function GameFiltersBar({ filters, onFiltersChange, mode, className, portalContainer }: GameFiltersBarProps) {
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [radiusOpen, setRadiusOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const updateFilter = <K extends keyof GameFilters>(key: K, value: GameFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getDateLabel = () => {
    if (!filters.date) return 'Date';
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    
    if (isSameDay(filters.date, today)) return 'Date: Today';
    if (isSameDay(filters.date, tomorrow)) return 'Date: Tomorrow';
    return `Date: ${format(filters.date, 'MMM d')}`;
  };

  const getTimeLabel = () => {
    const tw = TIME_WINDOWS.find(t => t.value === filters.timeWindow);
    return filters.timeWindow === 'any' ? 'Time: Any' : `Time: ${tw?.label || 'Any'}`;
  };

  const formatWhenLabel = () => {
    if (!filters.date && filters.timeWindow === 'any') return 'When';
    
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    
    let dateText = '';
    if (!filters.date) {
      dateText = '';
    } else if (isSameDay(filters.date, today)) {
      dateText = 'Today';
    } else if (isSameDay(filters.date, tomorrow)) {
      dateText = 'Tomorrow';
    } else {
      dateText = format(filters.date, 'MMM d');
    }
    
    let timeText = '';
    if (filters.timeWindow !== 'any') {
      const tw = TIME_WINDOWS.find(t => t.value === filters.timeWindow);
      timeText = tw?.label || '';
    }
    
    if (dateText && timeText) return `${dateText} • ${timeText}`;
    if (dateText) return dateText;
    if (timeText) return timeText;
    return 'When';
  };

  const getSortLabel = () => {
    const opt = SORT_OPTIONS.find(s => s.value === filters.sortBy);
    return opt?.label || 'Soonest';
  };

  const quickSetDate = (days: number | null) => {
    if (days === null) {
      updateFilter('date', null);
    } else {
      updateFilter('date', addDays(startOfDay(new Date()), days));
    }
    setDateOpen(false);
  };

  const setWeekend = () => {
    const today = startOfDay(new Date());
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
    const thisSaturday = addDays(today, daysUntilSaturday);
    updateFilter('date', thisSaturday);
  };

  const setNextWeek = () => {
    const today = startOfDay(new Date());
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
    const nextMonday = addDays(today, daysUntilMonday);
    updateFilter('date', nextMonday);
  };

  const ControlButton = ({ 
    onClick, 
    children, 
    icon: Icon 
  }: { 
    onClick: () => void; 
    children: React.ReactNode; 
    icon?: React.ElementType;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="
        flex-1 basis-0
        min-w-0
        h-11 rounded-2xl
        bg-white/5 border border-white/12
        backdrop-blur
        px-4
        flex items-center gap-2
        text-white/90
        hover:bg-white/8 active:bg-white/10
        transition
      "
    >
      {Icon && <Icon className="shrink-0 w-4 h-4" aria-hidden="true" />}
      <span className="truncate">{children}</span>
    </button>
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Filter Controls Row */}
      <div className="flex gap-3" role="group" aria-label="Game filters">
            {/* When Filter */}
            <Sheet open={dateOpen} onOpenChange={setDateOpen}>
            <SheetTrigger asChild>
              <ControlButton onClick={() => setDateOpen(true)} icon={Calendar}>
                {formatWhenLabel()}
              </ControlButton>
            </SheetTrigger>
            <SheetContent 
              side="bottom" 
              className="pb-8"
            >
              <SheetHeader>
                <SheetTitle>Choose when you'd like to play</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => quickSetDate(null)}
                    className="h-10"
                  >
                    Any Date
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => quickSetDate(0)}
                    className="h-10"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => quickSetDate(1)}
                    className="h-10"
                  >
                    Tomorrow
                  </Button>
                </div>
                <div className="flex justify-center">
                  <CalendarComponent
                    mode="single"
                    selected={filters.date || undefined}
                    onSelect={(date) => {
                      updateFilter('date', date || null);
                      if (date) setDateOpen(false);
                    }}
                    disabled={(date) => date < startOfDay(new Date())}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Radius Filter (Nearby mode only) */}
          {mode === 'nearby' && (
            <Sheet open={radiusOpen} onOpenChange={setRadiusOpen}>
              <SheetTrigger asChild>
                <ControlButton onClick={() => setRadiusOpen(true)} icon={MapPin}>
                  {filters.radiusKm} km
                </ControlButton>
              </SheetTrigger>
              <SheetContent 
                side="bottom" 
                className="pb-8"
              >
                <SheetHeader>
                  <SheetTitle>How far are you willing to travel?</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {RADIUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        updateFilter('radiusKm', opt.value as 5 | 10 | 25);
                        setRadiusOpen(false);
                      }}
                      className={cn(
                        "w-full h-12 px-4 rounded-lg font-medium text-sm transition-all",
                        "flex items-center gap-2",
                        filters.radiusKm === opt.value
                          ? "bg-white/20 text-white border border-white/28"
                          : "bg-white/[0.06] text-white/80 hover:bg-white/[0.10] border border-transparent"
                      )}
                    >
                      <MapPin className="h-4 w-4" />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Sort Options */}
          <Sheet open={sortOpen} onOpenChange={setSortOpen}>
            <SheetTrigger asChild>
              <ControlButton onClick={() => setSortOpen(true)} icon={ArrowDownWideNarrow}>
                {getSortLabel()}
              </ControlButton>
            </SheetTrigger>
            <SheetContent 
              side="bottom" 
              className="pb-8"
            >
              <SheetHeader>
                <SheetTitle>Order your results</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      updateFilter('sortBy', opt.value);
                      setSortOpen(false);
                    }}
                    className={cn(
                      "w-full h-12 px-4 rounded-lg font-medium text-sm transition-all",
                      "flex items-center gap-2",
                      filters.sortBy === opt.value
                        ? "bg-white/20 text-white border border-white/28"
                        : "bg-white/[0.06] text-white/80 hover:bg-white/[0.10] border border-transparent"
                    )}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
      </div>
    </div>
  );
}

// Helper functions for date chip logic
function isThisWeekend(date: Date): boolean {
  const day = date.getDay();
  const today = startOfDay(new Date());
  const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
  const thisSaturday = addDays(today, daysUntilSaturday);
  const thisSunday = addDays(thisSaturday, 1);
  
  return isSameDay(date, thisSaturday) || isSameDay(date, thisSunday);
}

function isNextWeek(date: Date): boolean {
  const today = startOfDay(new Date());
  const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
  const nextMonday = addDays(today, daysUntilMonday);
  const nextSunday = addDays(nextMonday, 6);
  
  return date >= nextMonday && date <= nextSunday;
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
