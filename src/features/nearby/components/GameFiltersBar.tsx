import React, { useState } from 'react';
import { Calendar, Clock, Users, MapPin, ArrowUpDown } from 'lucide-react';
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
    setDateOpen(false);
  };

  const ChipButton = ({ 
    active, 
    onClick, 
    children, 
    icon: Icon 
  }: { 
    active?: boolean; 
    onClick: () => void; 
    children: React.ReactNode; 
    icon?: React.ElementType;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "h-8 px-3.5 rounded-2xl font-medium text-[13px] transition-all duration-200",
        "flex items-center gap-1.5 whitespace-nowrap",
        "active:scale-95",
        active 
          ? "bg-gradient-to-br from-[#6E9277] to-[#89A78C] text-white shadow-lg" 
          : "bg-white/[0.08] text-white/65 hover:bg-white/[0.15] hover:text-white/85"
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </button>
  );

  return (
    <div className={cn('sticky top-0 z-10 bg-black/80 backdrop-blur-lg border-b border-white/[0.08]', className)}>
      {/* Horizontal scroll container */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 px-3 py-2 min-w-max">
          {/* Date Filter */}
          <Sheet open={dateOpen} onOpenChange={setDateOpen}>
            <SheetTrigger asChild>
              <ChipButton active={!!filters.date} onClick={() => setDateOpen(true)} icon={Calendar}>
                {getDateLabel()}
              </ChipButton>
            </SheetTrigger>
            <SheetContent side="bottom" className="pb-8">
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

          {/* Time Window Filter */}
          <Sheet open={timeOpen} onOpenChange={setTimeOpen}>
            <SheetTrigger asChild>
              <ChipButton active={filters.timeWindow !== 'any'} onClick={() => setTimeOpen(true)} icon={Clock}>
                {TIME_WINDOWS.find(tw => tw.value === filters.timeWindow)?.label || 'Time'}
              </ChipButton>
            </SheetTrigger>
            <SheetContent side="bottom" className="pb-8">
              <SheetHeader>
                <SheetTitle>Select a time window</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {TIME_WINDOWS.map((tw) => (
                  <button
                    key={tw.value}
                    onClick={() => {
                      updateFilter('timeWindow', tw.value);
                      setTimeOpen(false);
                    }}
                    className={cn(
                      "w-full h-12 px-4 rounded-lg font-medium text-sm transition-all",
                      "flex items-center justify-between",
                      filters.timeWindow === tw.value
                        ? "bg-gradient-to-br from-[#6E9277] to-[#89A78C] text-white"
                        : "bg-white/[0.06] text-white/80 hover:bg-white/[0.10]"
                    )}
                  >
                    <span>{tw.label}</span>
                    {tw.hours && <span className="text-xs opacity-70">{tw.hours}</span>}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Hide Full Games Toggle */}
          <button
            onClick={() => updateFilter('hideFullGames', !filters.hideFullGames)}
            className={cn(
              "h-8 px-3.5 rounded-2xl font-medium text-[13px] transition-all duration-200",
              "flex items-center gap-1.5 whitespace-nowrap uppercase tracking-wide",
              "active:scale-95",
              filters.hideFullGames
                ? "bg-gradient-to-br from-[#6E9277] to-[#89A78C] text-white shadow-lg"
                : "bg-white/[0.08] text-white/65 hover:bg-white/[0.15] hover:text-white/85"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            Hide Full
          </button>

          {/* Radius Filter (Nearby mode only) */}
          {mode === 'nearby' && (
            <Sheet open={radiusOpen} onOpenChange={setRadiusOpen}>
              <SheetTrigger asChild>
                <ChipButton active onClick={() => setRadiusOpen(true)} icon={MapPin}>
                  {filters.radiusKm} km
                </ChipButton>
              </SheetTrigger>
              <SheetContent side="bottom" className="pb-8">
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
                          ? "bg-gradient-to-br from-[#6E9277] to-[#89A78C] text-white"
                          : "bg-white/[0.06] text-white/80 hover:bg-white/[0.10]"
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
              <ChipButton onClick={() => setSortOpen(true)} icon={ArrowUpDown}>
                {SORT_OPTIONS.find((s) => s.value === filters.sortBy)?.label}
              </ChipButton>
            </SheetTrigger>
            <SheetContent side="bottom" className="pb-8">
              <SheetHeader>
                <SheetTitle>Order your results</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {SORT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
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
                          ? "bg-gradient-to-br from-[#6E9277] to-[#89A78C] text-white"
                          : "bg-white/[0.06] text-white/80 hover:bg-white/[0.10]"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
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
