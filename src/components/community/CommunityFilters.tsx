import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpDown, Check, Clock, Heart, MessageCircle, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { StandardBottomSheet, SheetOptionRow } from '@/components/ui/standard-bottom-sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const sortOptions: { id: CommunitySortOption; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'newest', label: 'Newest first', description: 'Most recent posts', icon: <Clock className="w-5 h-5" /> },
  { id: 'most-liked', label: 'Most liked', description: 'Popular with the community', icon: <Heart className="w-5 h-5" /> },
  { id: 'most-discussed', label: 'Most discussed', description: 'Lots of conversation', icon: <MessageCircle className="w-5 h-5" /> },
  { id: 'friends-first', label: 'Friends first', description: 'People you know', icon: <Users className="w-5 h-5" /> },
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

  const currentSortLabel = sortOptions.find(s => s.id === sortOption)?.label || 'Sort';

  const handleSortSelect = (sort: CommunitySortOption) => {
    onSortChange(sort);
    setDrawerOpen(false);
  };

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
              <>
                <button
                  onClick={() => setDrawerOpen(true)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap",
                    "bg-muted/60 text-foreground border border-border/40",
                    "hover:bg-muted transition-colors"
                  )}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Sort</span>
                </button>
                <StandardBottomSheet
                  isOpen={drawerOpen}
                  onClose={() => setDrawerOpen(false)}
                  title="Sort by"
                  subtitle="Choose how results are ordered"
                >
                  <div className="space-y-2">
                    {sortOptions.map((option) => (
                      <SheetOptionRow
                        key={option.id}
                        label={option.label}
                        description={option.description}
                        selected={sortOption === option.id}
                        onSelect={() => handleSortSelect(option.id)}
                        icon={option.icon}
                      />
                    ))}
                  </div>
                </StandardBottomSheet>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap",
                      "bg-muted/60 text-foreground border border-border/40",
                      "hover:bg-muted transition-colors"
                    )}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>Sort</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-background border border-border z-50">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.id}
                      onClick={() => handleSortSelect(option.id)}
                      className={cn(
                        "flex items-center justify-between cursor-pointer",
                        sortOption === option.id && "text-primary font-medium"
                      )}
                    >
                      <span>{option.label}</span>
                      {sortOption === option.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Divider */}
            <div className="w-px h-5 bg-border/50 mx-1" />

            {/* Media Filter Pills */}
            {mediaFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
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
