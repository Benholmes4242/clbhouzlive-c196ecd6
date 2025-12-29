import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpDown, X, TrendingUp, ThumbsUp, MessageSquare, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { AnimatedCheck } from '@/components/ui/AnimatedCheck';
import { triggerHaptic } from '@/lib/ui/haptics';

export type CommunityMediaFilter = 'all' | 'shorts' | 'videos' | 'photos';
export type CommunitySortOption = 'newest' | 'most-liked' | 'most-discussed' | 'friends-first';

interface CommunityFiltersProps {
  activeFilter: CommunityMediaFilter;
  onFilterChange: (filter: CommunityMediaFilter) => void;
  sortOption: CommunitySortOption;
  onSortChange: (sort: CommunitySortOption) => void;
}

const mediaFilters: { id: CommunityMediaFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'videos', label: 'Videos' },
  { id: 'photos', label: 'Photos' },
];

const sortOptions: { id: CommunitySortOption; label: string; icon: React.ElementType }[] = [
  { id: 'newest', label: 'Newest first', icon: TrendingUp },
  { id: 'most-liked', label: 'Most liked', icon: ThumbsUp },
  { id: 'most-discussed', label: 'Most discussed', icon: MessageSquare },
  { id: 'friends-first', label: 'Friends first', icon: Users },
];

export const CommunityFilters: React.FC<CommunityFiltersProps> = ({
  activeFilter,
  onFilterChange,
  sortOption,
  onSortChange,
}) => {
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setIsAtStart(scrollLeft <= 10);
    setIsAtEnd(scrollLeft >= scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollPosition();
  }, []);

  const handleSortSelect = (sort: CommunitySortOption) => {
    triggerHaptic('selection');
    onSortChange(sort);
    setDrawerOpen(false);
  };

  const SortContent = () => (
    <div 
      className="px-4 overflow-y-auto"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 84px)',
        maxHeight: 'calc(75vh - 140px)',
      }}
    >
      <div className="space-y-2">
        {sortOptions.map((option) => {
          const isActive = sortOption === option.id;
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

  return (
    <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm pb-2">
      <div className="px-3 md:container md:mx-auto md:px-0">
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
            {isMobile ? (
              <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0",
                      "bg-muted/60 text-foreground border border-border/40",
                      "hover:bg-muted transition-colors active:scale-[0.98]"
                    )}
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
                  <SortContent />
                </DrawerContent>
              </Drawer>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0",
                      "bg-muted/60 text-foreground border border-border/40",
                      "hover:bg-muted transition-colors"
                    )}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>Sort</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className="w-52 p-1.5 bg-white/95 dark:bg-black/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-xl shadow-lg z-50"
                >
                  {sortOptions.map((option) => {
                    const isActive = sortOption === option.id;
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
            )}

            {/* Divider */}
            <div className="w-px h-5 bg-border/50 mx-1 shrink-0" />

            {/* Media Filter Pills */}
            {mediaFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => onFilterChange(filter.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                  activeFilter === filter.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Gradient overlays */}
          {!isAtStart && (
            <div className="absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
          )}
          {!isAtEnd && (
            <div className="absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityFilters;
