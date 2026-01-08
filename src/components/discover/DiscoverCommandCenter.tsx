import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Search, X, ArrowUpDown, TrendingUp, ThumbsUp, MessageSquare, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AnimatedCheck } from '@/components/ui/AnimatedCheck';
import { triggerHaptic } from '@/lib/ui/haptics';

export type SortOption = 'newest' | 'most-liked' | 'most-discussed' | 'friends-first';

export interface Pill {
  key: string;
  label: string;
  icon?: React.ReactNode;
  selected?: boolean;
}

interface DiscoverCommandCenterProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortLabel?: string;
  sortValue: SortOption;
  onSortChange: (sort: SortOption) => void;
  defaultSortValue?: SortOption; // For visual indicator when non-default
  pills: Pill[];
  onPillSelect: (key: string) => void;
  showPills?: boolean;
  className?: string;
}

const SORT_OPTIONS: { id: SortOption; label: string; icon: React.ElementType }[] = [
  { id: 'newest', label: 'Newest first', icon: TrendingUp },
  { id: 'most-liked', label: 'Most liked', icon: ThumbsUp },
  { id: 'most-discussed', label: 'Most discussed', icon: MessageSquare },
  { id: 'friends-first', label: 'Friends first', icon: Users },
];

/**
 * DiscoverCommandCenter - Unified control block for all Discover tabs
 * 
 * Structure:
 * - Top gap
 * - Search bar
 * - Pills row: Sort pill + divider + filter pills
 * - Bottom gap
 */
export const DiscoverCommandCenter: React.FC<DiscoverCommandCenterProps> = ({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  defaultSortValue = 'newest',
  pills,
  onPillSelect,
  showPills = true,
  className,
}) => {
  const isNonDefaultSort = sortValue !== defaultSortValue;
  const isMobile = useIsMobile();
  const [isFocused, setIsFocused] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setIsAtStart(scrollLeft <= 10);
    setIsAtEnd(scrollLeft >= scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollPosition();
  }, [pills]);

  const handleClear = () => {
    onSearchChange('');
    inputRef.current?.focus();
  };

  const handleSortSelect = (sort: SortOption) => {
    triggerHaptic('selection');
    onSortChange(sort);
    setDrawerOpen(false);
  };

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sort options content (inline to avoid hook issues with inner components)
  const sortOptionsContent = (
    <div 
      className="px-4 pb-6 overflow-y-auto"
      style={{
        paddingBottom: '24px',
        maxHeight: 'calc(75vh - 140px)',
      }}
    >
      <div className="space-y-2">
        {SORT_OPTIONS.map((option) => {
          const isActive = sortValue === option.id;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSortSelect(option.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl transition-all active:scale-[0.98]"
              style={{
                background: isActive ? 'var(--cm-surface-slate)' : 'var(--cm-surface-alt)',
                border: isActive ? 'none' : '1px solid var(--cm-border-subtle)',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.15)' : 'var(--cm-surface-card)',
                    border: isActive ? 'none' : '1px solid var(--cm-border-subtle)',
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isActive ? 'white' : 'var(--cm-icon-primary)' }}
                  />
                </div>
                <span
                  className="font-medium text-sm"
                  style={{ color: isActive ? 'white' : 'var(--cm-text-primary)' }}
                >
                  {option.label}
                </span>
              </div>
              {isActive && <AnimatedCheck />}
            </button>
          );
        })}
      </div>
    </div>
  );

  const pillClasses = cn(
    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0",
    "transition-colors active:scale-[0.98]",
    "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
    isNonDefaultSort
      ? "bg-foreground/15 text-foreground border border-foreground/30"
      : "bg-muted/60 text-foreground border border-border/40 hover:bg-muted"
  );

  // Sort pill - renders as Drawer on mobile, DropdownMenu on desktop
  const sortPillElement = isMobile ? (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>
        <button 
          type="button" 
          className={pillClasses}
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sort</span>
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="px-4 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DrawerTitle
                className="text-lg font-semibold text-left"
                style={{ color: 'var(--cm-text-primary)' }}
              >
                Sort by
              </DrawerTitle>
              <p 
                className="text-sm mt-1 text-left"
                style={{ color: 'var(--cm-text-secondary)' }}
              >
                Choose how results are ordered
              </p>
            </div>
            <DrawerClose asChild>
              <button
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--cm-surface-alt)' }}
                aria-label="Close"
              >
                <X className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        {sortOptionsContent}
      </DrawerContent>
    </Drawer>
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={pillClasses}>
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sort</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-52 p-1.5 bg-white/95 dark:bg-black/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-xl shadow-lg z-50"
      >
        {SORT_OPTIONS.map((option) => {
          const isActive = sortValue === option.id;
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.id}
              onClick={() => handleSortSelect(option.id)}
              className={cn(
                "flex items-center justify-between cursor-pointer rounded-lg px-3 py-2.5",
                isActive 
                  ? "bg-slate-100/80 dark:bg-white/10 font-semibold text-slate-900 dark:text-white"
                  : "text-slate-700 dark:text-white/90"
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span>{option.label}</span>
              </div>
              <div className="w-5 flex justify-end">
                {isActive && <AnimatedCheck />}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className={cn("bg-[var(--bg-page)]", className)}>
      {/* Top spacing gap */}
      <div className="h-4" />

      {/* Search bar */}
      <div ref={containerRef} className="px-5 relative">
        <div className="relative h-10">
          {/* Background layer with blur */}
          <div 
            className={cn(
              "absolute inset-0 rounded-full border transition-all duration-200",
              "bg-background/60 border-border/60",
              isFocused && "bg-background/80 border-border"
            )}
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          />
          {/* Content layer */}
          <div className="relative h-full flex items-center">
            <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder={searchPlaceholder}
              className="w-full h-full pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground rounded-full bg-transparent"
              style={{
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            />
            {searchValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 inset-y-0 flex items-center p-1 hover:opacity-70 transition-opacity"
              >
                <X className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pills row */}
      {showPills && (
        <div className="mt-3 px-3 md:container md:mx-auto md:px-0">
          <div className="relative">
            <div
              ref={scrollContainerRef}
              className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1"
              onScroll={checkScrollPosition}
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {/* Sort Pill */}
              {sortPillElement}

              {/* Divider */}
              <div className="w-px h-5 bg-border/50 mx-1 shrink-0" />

              {/* Filter Pills */}
              {pills.map((pill) => (
                <motion.button
                  key={pill.key}
                  onClick={() => onPillSelect(pill.key)}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.1 }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                    "flex items-center gap-1.5",
                    pill.selected
                      ? "bg-foreground text-background"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
                  )}
                >
                  {pill.icon && (
                    <span className="flex items-center justify-center w-4 h-4 leading-none">
                      {pill.icon}
                    </span>
                  )}
                  <span className="leading-none">{pill.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Gradient overlays */}
            {!isAtStart && (
              <div className="absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-[var(--bg-page)] to-transparent pointer-events-none z-10" />
            )}
            {!isAtEnd && (
              <div className="absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-[var(--bg-page)] to-transparent pointer-events-none z-10" />
            )}
          </div>
        </div>
      )}

      {/* Bottom spacing gap */}
      <div className="h-4" />
    </div>
  );
};

export default DiscoverCommandCenter;
