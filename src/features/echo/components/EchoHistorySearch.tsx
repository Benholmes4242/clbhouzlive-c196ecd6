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
import { HudDropdown, HudDropdownOption } from '@/components/hud/HudDropdown';

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
  const [datePresetLabel, setDatePresetLabel] = useState<string | null>('Most recent');
  const [datePresetValue, setDatePresetValue] = useState<string>('recent');
  const [currentDateFrom, setCurrentDateFrom] = useState<Date | null>(null);
  const [currentDateTo, setCurrentDateTo] = useState<Date | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const debouncedQuery = useDebounce(query, 200);
  
  // Date filter options for HudDropdown
  const dateOptions: HudDropdownOption[] = [
    { label: 'Most recent', value: 'recent' },
    { label: 'Today', value: 'today' },
    { label: 'This week', value: 'week' },
    { label: 'Last 30 days', value: 'last30' },
  ];

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
      case 'recent':
      case 'most_recent':
        return null; // No date filtering for "Most recent"
      case 'today':
        return { from: startOfDay(today), to: endOfDay(today) };
      case 'week':
      case 'this_week':
        return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
      case 'last30':
      case 'last_30d':
        return { from: startOfDay(subDays(today, 30)), to: endOfDay(today) };
      default:
        return null;
    }
  };
  
  const handleDatePresetChange = (value: string) => {
    setDatePresetValue(value);
    
    const labelMap: Record<string, string> = {
      'recent': 'Most recent',
      'today': 'Today',
      'week': 'This week',
      'last30': 'Last 30 days',
    };
    
    const preset = value;
    const label = labelMap[value];
    const dates = getPresetDates(preset);
    
    if (preset === 'recent') {
      // Clear date filters for "Most recent"
      setDatePresetLabel('Most recent');
      setCurrentDateFrom(null);
      setCurrentDateTo(null);
      onFilterChange({
        ...getFilterValues(),
        dateFrom: undefined,
        dateTo: undefined,
      });
    } else if (dates) {
      setDatePresetLabel(label);
      setCurrentDateFrom(dates.from);
      setCurrentDateTo(dates.to);
      onFilterChange({
        ...getFilterValues(),
        dateFrom: dates.from,
        dateTo: dates.to,
      });
    }
  };

  const handlePresetClick = (preset: string, label: string) => {
    const dates = getPresetDates(preset);
    if (preset === 'most_recent') {
      // Clear date filters for "Most recent"
      setDatePresetLabel('Most recent');
      setCurrentDateFrom(null);
      setCurrentDateTo(null);
      setShowCustomPicker(false);
      
      const newFilters = getFilterValues();
      delete newFilters.dateFrom;
      delete newFilters.dateTo;
      onFilterChange(newFilters);
    } else if (dates) {
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
  ];

  return (
    <div className={className} style={{ minWidth: 0, overflowX: 'hidden', touchAction: 'pan-y' }}>
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
          className="w-full h-10 pl-10 pr-10 rounded-[14px] text-body-md transition-colors"
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
      <div 
        className="flex gap-2 overflow-x-auto no-scrollbar pb-1" 
        style={{ touchAction: 'pan-x', overscrollBehaviorY: 'none' }}
        onTouchStart={(e) => {
          // Prevent parent scroll while scrolling chips
          e.currentTarget.style.pointerEvents = 'auto';
        }}
      >
        {/* Tag filter pill (if active) */}
        {activeTag && (
          <div
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-body-sm font-medium"
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
              className="flex-shrink-0 h-[34px] px-3 rounded-[10px] text-body-md font-medium transition-all"
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
        
        {/* Date Filter Pill with HudDropdown */}
        <HudDropdown
          value={datePresetValue}
          options={dateOptions}
          onChange={handleDatePresetChange}
          className="flex-shrink-0"
        />
      </div>
    </div>
  );
};
