import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ListOrdered, Users, CheckCircle2, Circle, ArrowDownAZ, ArrowUpZA, MessageSquare, Star } from 'lucide-react';
import { triggerHaptic } from '@/lib/ui/haptics';
import { AnimatedCheck } from '@/components/ui/AnimatedCheck';
import { Z } from '@/config/zIndex';
import type { Top100FilterChip, Top100SortMode } from './Top100ListFilterChips';

interface FilterOption {
  value: Top100FilterChip;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface SortOption {
  value: Top100SortMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  requiresReviewData?: boolean;
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    value: 'official',
    label: 'Official',
    description: 'Official Top 100 list rankings',
    icon: <ListOrdered className="w-5 h-5" />,
  },
  {
    value: 'community',
    label: 'Community',
    description: 'Ranked by Clbhouz community',
    icon: <Users className="w-5 h-5" />,
  },
  {
    value: 'played',
    label: 'Played',
    description: "Courses you've marked as played",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    value: 'unplayed',
    label: 'Unplayed',
    description: "Courses you haven't played yet",
    icon: <Circle className="w-5 h-5" />,
  },
];

const SORT_OPTIONS: SortOption[] = [
  {
    value: 'rank',
    label: 'Rank',
    description: 'Official rank / Community rank',
    icon: <ListOrdered className="w-5 h-5" />,
  },
  {
    value: 'az',
    label: 'A–Z',
    description: 'Course name',
    icon: <ArrowDownAZ className="w-5 h-5" />,
  },
  {
    value: 'za',
    label: 'Z–A',
    description: 'Course name',
    icon: <ArrowUpZA className="w-5 h-5" />,
  },
  {
    value: 'most_reviewed',
    label: 'Most reviewed',
    description: 'Most community reviews',
    icon: <MessageSquare className="w-5 h-5" />,
    requiresReviewData: true,
  },
  {
    value: 'highest_rated',
    label: 'Highest rated',
    description: 'Best average rating',
    icon: <Star className="w-5 h-5" />,
    requiresReviewData: true,
  },
];

interface Top100FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilter: Top100FilterChip;
  onFilterChange: (filter: Top100FilterChip) => void;
  activeSort: Top100SortMode;
  onSortChange: (sort: Top100SortMode) => void;
  counts?: Partial<Record<Top100FilterChip, number>>;
  hasReviewData?: boolean;
}

/**
 * Top100FilterSheet - Bottom sheet for selecting list filter and sort
 * Matches the Create Moment "Who can see this?" sheet style
 * Uses portal to escape stacking context from PageRoot transforms
 */
export const Top100FilterSheet: React.FC<Top100FilterSheetProps> = ({
  isOpen,
  onClose,
  activeFilter,
  onFilterChange,
  activeSort,
  onSortChange,
  counts = {},
  hasReviewData = false,
}) => {
  const [portalRoot, setPortalRoot] = useState<Element | null>(null);

  // Get portal root on mount (client-side only)
  useEffect(() => {
    setPortalRoot(document.getElementById('portal-root') || document.body);
  }, []);

  const handleFilterSelect = (value: Top100FilterChip) => {
    triggerHaptic('selection');
    onFilterChange(value);
    onClose();
  };

  const handleSortSelect = (value: Top100SortMode) => {
    triggerHaptic('selection');
    onSortChange(value);
    onClose();
  };

  // Filter sort options based on review data availability
  const availableSortOptions = SORT_OPTIONS.filter(
    (opt) => !opt.requiresReviewData || hasReviewData
  );

  // Don't render until we have the portal root
  if (!portalRoot) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0"
          style={{ zIndex: Z.sheetBackdrop }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Sheet - Dark mode */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-card border-t border-border max-h-[85vh] overflow-y-auto"
            style={{
              zIndex: Z.sheet,
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4">
              <h3 className="text-lg font-semibold text-foreground">Filter & Sort</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Section A - Show */}
            <div className="px-4 pb-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Show
              </h4>
              <div className="space-y-1.5">
                {FILTER_OPTIONS.map((option) => {
                  const isSelected = activeFilter === option.value;
                  const count = counts[option.value];

                  return (
                    <motion.button
                      key={option.value}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleFilterSelect(option.value)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all"
                      style={{
                        background: isSelected 
                          ? 'var(--cm-surface-slate)' 
                          : 'var(--cm-surface-alt)',
                        border: isSelected 
                          ? 'none' 
                          : '1px solid var(--cm-border-subtle)',
                        boxShadow: isSelected 
                          ? '0 2px 8px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.1)' 
                          : 'none',
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ 
                          background: isSelected ? 'rgba(255,255,255,0.18)' : 'var(--cm-surface-card)',
                          color: isSelected ? 'white' : 'var(--cm-icon-primary)',
                        }}
                      >
                        {option.icon}
                      </div>

                      <div className="flex-1 text-left">
                        <p
                          className="font-medium text-[13px]"
                          style={{ color: isSelected ? 'white' : 'var(--cm-text-primary)' }}
                        >
                          {option.label}
                          {count !== undefined && count > 0 && (
                            <span
                              className="ml-1.5 text-[11px]"
                              style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--cm-text-tertiary)' }}
                            >
                              ({count})
                            </span>
                          )}
                        </p>
                        <p
                          className="text-[11px] mt-0.5"
                          style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--cm-text-tertiary)' }}
                        >
                          {option.description}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="opacity-100">
                          <AnimatedCheck />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-border mb-4" />

            {/* Section B - Sort by */}
            <div className="px-4 pb-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Sort by
              </h4>
              <div className="space-y-1.5">
                {availableSortOptions.map((option) => {
                  const isSelected = activeSort === option.value;
                  // Dynamic description for Rank based on active filter
                  let description = option.description;
                  if (option.value === 'rank') {
                    description = activeFilter === 'community' 
                      ? 'Community rank' 
                      : 'Official rank';
                  }

                  return (
                    <motion.button
                      key={option.value}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSortSelect(option.value)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all"
                      style={{
                        background: isSelected 
                          ? 'var(--cm-surface-slate)' 
                          : 'var(--cm-surface-alt)',
                        border: isSelected 
                          ? 'none' 
                          : '1px solid var(--cm-border-subtle)',
                        boxShadow: isSelected 
                          ? '0 2px 8px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.1)' 
                          : 'none',
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ 
                          background: isSelected ? 'rgba(255,255,255,0.18)' : 'var(--cm-surface-card)',
                          color: isSelected ? 'white' : 'var(--cm-icon-primary)',
                        }}
                      >
                        {option.icon}
                      </div>

                      <div className="flex-1 text-left">
                        <p
                          className="font-medium text-[13px]"
                          style={{ color: isSelected ? 'white' : 'var(--cm-text-primary)' }}
                        >
                          {option.label}
                        </p>
                        <p
                          className="text-[11px] mt-0.5"
                          style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--cm-text-tertiary)' }}
                        >
                          {description}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="opacity-100">
                          <AnimatedCheck />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalRoot
  );
};

export default Top100FilterSheet;
