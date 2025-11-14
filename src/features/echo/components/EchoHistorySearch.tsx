/**
 * Echo History Search Bar with Filter Pills
 * Apple-style search + frosted filter chips
 */

import React, { useState, useEffect } from 'react';
import { Search, X, Calendar, ChevronDown } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { echoHistoryAnalytics } from '../analytics/echoHistoryAnalytics';
import { extractTagDirective } from '../utils/parseTagDirective';
import { format, startOfToday, startOfWeek, endOfWeek, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';

export type FilterType = 'all' | 'favourite';

interface EchoHistorySearchProps {
  onSearchChange: (query: string) => void;
  onFilterChange: (filters: {
    hasResponse?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
    starred?: boolean;
    tag?: string;
  }) => void;
  activeTag?: string;
  className?: string;
}

export const EchoHistorySearch: React.FC<EchoHistorySearchProps> = ({
  onSearchChange,
  onFilterChange,
  activeTag,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [datePresetLabel, setDatePresetLabel] = useState<string | null>(null);
  const [currentDateFrom, setCurrentDateFrom] = useState<Date | null>(null);
  const [currentDateTo, setCurrentDateTo] = useState<Date | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const debouncedQuery = useDebounce(query, 200);

  // Propagate debounced search query
  useEffect(() => {
    onSearchChange(debouncedQuery);
  }, [debouncedQuery, onSearchChange]);

  // Get filter values based on current state
  const getFilterValues = () => {
    const filters: { 
      hasResponse?: boolean; 
      dateFrom?: Date; 
      dateTo?: Date;
      starred?: boolean; 
      tag?: string;
    } = {};

    if (activeFilter === 'favourite') {
      filters.starred = true;
    }
    
    if (currentDateFrom) filters.dateFrom = currentDateFrom;
    if (currentDateTo) filters.dateTo = currentDateTo;
    
    // Preserve tag filter if active
    if (activeTag) {
      filters.tag = activeTag;
    }

    return filters;
  };

  // Handle filter changes
  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
    
    const filters = getFilterValues();
    if (filter === 'favourite') {
      filters.starred = true;
    } else {
      filters.starred = undefined;
    }

    onFilterChange(filters);
    
    // Track filter analytics
    if (filter !== 'all') {
      echoHistoryAnalytics.filterApplied({
        starred: filters.starred,
      });
    }
  };

  const getPresetDates = (preset: string): { from: Date; to: Date } | null => {
    const today = startOfToday();
    switch (preset) {
      case 'today':
        return { from: startOfDay(today), to: endOfDay(today) };
      case 'this_week':
        return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
      case 'last_week': {
        const lastWeekStart = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
        const lastWeekEnd = endOfWeek(subDays(today, 7), { weekStartsOn: 1 });
        return { from: lastWeekStart, to: lastWeekEnd };
      }
      case 'last_30d':
        return { from: startOfDay(subDays(today, 30)), to: endOfDay(today) };
      default:
        return null;
    }
  };

  const handlePresetClick = (preset: string, label: string) => {
    const dates = getPresetDates(preset);
    if (dates) {
      setDatePresetLabel(label);
      setCurrentDateFrom(dates.from);
      setCurrentDateTo(dates.to);
      setShowCustomPicker(false);
      
      const newFilters = getFilterValues();
      newFilters.dateFrom = dates.from;
      newFilters.dateTo = dates.to;
      onFilterChange(newFilters);

      echoHistoryAnalytics.filterApplied({
        date_from: dates.from.toISOString(),
      });
    }
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      const from = startOfDay(customFrom);
      const to = endOfDay(customTo);
      setDatePresetLabel(`${format(from, 'MMM d')} - ${format(to, 'MMM d')}`);
      setCurrentDateFrom(from);
      setCurrentDateTo(to);
      setShowCustomPicker(false);
      
      const newFilters = getFilterValues();
      newFilters.dateFrom = from;
      newFilters.dateTo = to;
      onFilterChange(newFilters);

      echoHistoryAnalytics.filterApplied({
        date_from: from.toISOString(),
      });
    }
  };

  const handleClearDate = () => {
    setDatePresetLabel(null);
    setCurrentDateFrom(null);
    setCurrentDateTo(null);
    setShowCustomPicker(false);
    setCustomFrom(undefined);
    setCustomTo(undefined);
    const newFilters = getFilterValues();
    delete newFilters.dateFrom;
    delete newFilters.dateTo;
    onFilterChange(newFilters);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // "/" to focus search
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        document.getElementById('echo-search-input')?.focus();
      }
      // Escape to clear
      if (e.key === 'Escape' && document.activeElement?.id === 'echo-search-input') {
        setQuery('');
        setActiveFilter('all');
        onFilterChange({});
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFilterChange]);

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'favourite', label: 'Favourite' },
  ];

  return (
    <div className={className}>
      {/* Search Input */}
      <div className="relative mb-2">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--hub-text-dim)' }}
        />
        <input
          id="echo-search-input"
          type="text"
          value={query}
          onChange={(e) => {
            const raw = e.target.value;
            const { cleanQuery, tag } = extractTagDirective(raw);
            
            // Update local query state with clean text
            setQuery(cleanQuery);
            
            // If a tag directive is present, update filters
            if (typeof tag !== 'undefined') {
              onFilterChange({ tag });
              if (tag) {
                echoHistoryAnalytics.tagFilterApplied({ tag });
              }
            }
          }}
          placeholder="Search conversations…"
          className="w-full h-10 pl-10 pr-10 rounded-[14px] text-[15px] transition-colors"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--hub-text)',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          }}
          aria-label="Search conversations"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setActiveFilter('all');
              onFilterChange({});
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors"
            style={{ color: 'var(--hub-text-dim)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-dim)'}
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {/* Tag filter pill (if active) */}
        {activeTag && (
          <div
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium"
            style={{
              background: 'rgba(110,146,119,0.15)',
              border: '1px solid rgba(110,146,119,0.25)',
              color: 'var(--hub-text)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <span>Tagged: {activeTag}</span>
            <button
              onClick={() => {
                onFilterChange({ tag: undefined });
              }}
              className="p-0.5 rounded-full hover:bg-white/15 transition-colors"
              aria-label="Clear tag filter"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => handleFilterClick(filter.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all"
              style={{
                background: isActive
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${
                  isActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'
                }`,
                color: isActive ? 'var(--hub-text)' : 'var(--hub-text-dim)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
              aria-pressed={isActive}
              aria-label={`Filter by ${filter.label}`}
            >
              {filter.label}
            </button>
          );
        })}
        
        {/* Date Filter Pill with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all",
              )}
              style={{
                background: datePresetLabel
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${
                  datePresetLabel ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'
                }`,
                color: datePresetLabel ? 'var(--hub-text)' : 'var(--hub-text-dim)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
              aria-haspopup="dialog"
              aria-label="Filter by date"
            >
              <span>{datePresetLabel ? `Date: ${datePresetLabel}` : 'Date'}</span>
              {datePresetLabel ? (
                <X 
                  className="w-3.5 h-3.5" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearDate();
                  }}
                />
              ) : (
                <ChevronDown className="w-3 h-3 opacity-80" aria-hidden />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start"
            className="min-w-[240px] backdrop-blur-xl bg-background/95 border-white/10"
            style={{ zIndex: 1200 }}
          >
            {!showCustomPicker ? (
              <>
                <DropdownMenuItem onClick={() => handlePresetClick('today', 'Today')}>
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePresetClick('this_week', 'This week')}>
                  This week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePresetClick('last_week', 'Last week')}>
                  Last week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePresetClick('last_30d', 'Last 30 days')}>
                  Last 30 days
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowCustomPicker(true)} className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Custom range
                </DropdownMenuItem>
                {datePresetLabel && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleClearDate} className="text-destructive">
                      Clear filter
                    </DropdownMenuItem>
                  </>
                )}
              </>
            ) : (
              <div className="p-3 space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">From</label>
                  <CalendarPicker
                    mode="single"
                    selected={customFrom}
                    onSelect={setCustomFrom}
                    className="pointer-events-auto"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">To</label>
                  <CalendarPicker
                    mode="single"
                    selected={customTo}
                    onSelect={setCustomTo}
                    disabled={(date) => customFrom ? date < customFrom : false}
                    className="pointer-events-auto"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowCustomPicker(false);
                      setCustomFrom(undefined);
                      setCustomTo(undefined);
                    }}
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCustomApply}
                    disabled={!customFrom || !customTo}
                    className={cn(
                      "flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-colors",
                      customFrom && customTo
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
