import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Search, X, ArrowUpDown, Clock, Heart, MessageCircle, Users, Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  defaultSortValue?: SortOption;
  pills: Pill[];
  onPillSelect: (key: string) => void;
  showPills?: boolean;
  className?: string;
}

interface SortOptionConfig {
  id: SortOption;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const SORT_OPTIONS: SortOptionConfig[] = [
  { id: 'newest', label: 'Newest first', description: 'Most recent posts appear first', icon: <Clock className="w-5 h-5" /> },
  { id: 'most-liked', label: 'Most liked', description: 'Posts with the most likes', icon: <Heart className="w-5 h-5" /> },
  { id: 'most-discussed', label: 'Most discussed', description: 'Posts with the most comments', icon: <MessageCircle className="w-5 h-5" /> },
  { id: 'friends-first', label: 'Friends first', description: 'Prioritize posts from friends', icon: <Users className="w-5 h-5" /> },
];

// Animated checkmark with draw-in effect (matches MomentAudienceSheet)
const AnimatedCheck: React.FC = () => (
  <motion.svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    initial="hidden"
    animate="visible"
  >
    <motion.path
      d="M4 10L8 14L16 6"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      variants={{
        hidden: { pathLength: 0, opacity: 0 },
        visible: { 
          pathLength: 1, 
          opacity: 1,
          transition: { 
            pathLength: { duration: 0.3, ease: "easeOut" },
            opacity: { duration: 0.1 }
          }
        }
      }}
    />
  </motion.svg>
);

// Sort Bottom Sheet Component (matches MomentAudienceSheet design)
interface SortBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sortValue: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const SortBottomSheet: React.FC<SortBottomSheetProps> = ({
  isOpen,
  onClose,
  sortValue,
  onSortChange,
}) => {
  const handleSelect = (value: SortOption) => {
    triggerHaptic('selection');
    onSortChange(value);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000]"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl"
            style={{ 
              background: 'var(--cm-surface-card)',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div 
                className="w-10 h-1 rounded-full"
                style={{ background: 'var(--cm-border)' }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4">
              <h3 
                className="text-lg font-semibold"
                style={{ color: 'var(--cm-text-primary)' }}
              >
                Sort by
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--cm-surface-alt)' }}
              >
                <X className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
              </button>
            </div>

            {/* Options */}
            <div className="px-4 pb-4 space-y-2">
              {SORT_OPTIONS.map(option => {
                const isSelected = sortValue === option.id;
                
                return (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(option.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{
                      background: isSelected 
                        ? 'var(--cm-surface-slate)' 
                        : 'var(--cm-surface-alt)',
                      border: isSelected 
                        ? 'none' 
                        : '1px solid var(--cm-border-subtle)',
                      boxShadow: isSelected 
                        ? '0 2px 8px rgba(0, 0, 0, 0.12)' 
                        : 'none',
                    }}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ 
                        background: isSelected ? 'rgba(255,255,255,0.15)' : 'var(--cm-surface-card)',
                        color: isSelected ? 'white' : 'var(--cm-icon-primary)',
                      }}
                    >
                      {option.icon}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <p 
                        className="font-medium text-sm"
                        style={{ color: isSelected ? 'white' : 'var(--cm-text-primary)' }}
                      >
                        {option.label}
                      </p>
                      <p 
                        className="text-xs mt-0.5"
                        style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--cm-text-tertiary)' }}
                      >
                        {option.description}
                      </p>
                    </div>
                    
                    {isSelected && <AnimatedCheck />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * DiscoverCommandCenter - Unified control block for all Discover tabs
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
  const [sheetOpen, setSheetOpen] = useState(false);
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
    onSortChange(sort);
    setSheetOpen(false);
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

  const SortPill = () => {
    const pillClasses = cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0",
      "transition-colors active:scale-[0.98]",
      isNonDefaultSort
        ? "bg-foreground/15 text-foreground border border-foreground/30"
        : "bg-muted/60 text-foreground border border-border/40 hover:bg-muted"
    );
    
    if (isMobile) {
      return (
        <>
          <button className={pillClasses} onClick={() => setSheetOpen(true)}>
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort</span>
          </button>
          <SortBottomSheet
            isOpen={sheetOpen}
            onClose={() => setSheetOpen(false)}
            sortValue={sortValue}
            onSortChange={handleSortSelect}
          />
        </>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={pillClasses}>
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
                <span>{option.label}</span>
                <div className="w-5 flex justify-end">
                  {isActive && (
                    <Check className="w-4 h-4 text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

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
              <SortPill />

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
                  {pill.icon && <span className="w-4 h-4">{pill.icon}</span>}
                  <span>{pill.label}</span>
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
