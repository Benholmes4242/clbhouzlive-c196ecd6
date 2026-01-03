import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ListOrdered, Users, CheckCircle2, Circle } from 'lucide-react';
import { triggerHaptic } from '@/lib/ui/haptics';
import { AnimatedCheck } from '@/components/ui/AnimatedCheck';
import { Z } from '@/config/zIndex';
import type { Top100FilterChip } from './Top100ListFilterChips';
interface FilterOption {
  value: Top100FilterChip;
  label: string;
  description: string;
  icon: React.ReactNode;
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

interface Top100FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilter: Top100FilterChip;
  onFilterChange: (filter: Top100FilterChip) => void;
  counts?: Partial<Record<Top100FilterChip, number>>;
}

/**
 * Top100FilterSheet - Bottom sheet for selecting list filter
 * Matches the Create Moment "Who can see this?" sheet style
 */
export const Top100FilterSheet: React.FC<Top100FilterSheetProps> = ({
  isOpen,
  onClose,
  activeFilter,
  onFilterChange,
  counts = {},
}) => {
  const handleSelect = (value: Top100FilterChip) => {
    triggerHaptic('selection');
    onFilterChange(value);
    onClose();
  };

  if (!isOpen) return null;

  const portalRoot =
    typeof window !== 'undefined'
      ? document.getElementById('portal-root') || document.body
      : null;

  if (!portalRoot) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0"
        style={{ zIndex: Z.sheetBackdrop }}
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
          className="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-white"
          style={{
            zIndex: Z.sheet,
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-slate-200" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-4">
            <h3 className="text-lg font-semibold text-slate-900">Filter courses</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* Options */}
          <div className="px-4 pb-4 space-y-1.5">
            {FILTER_OPTIONS.map((option) => {
              const isSelected = activeFilter === option.value;
              const count = counts[option.value];

              return (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-slate-800 shadow-md'
                      : 'bg-slate-50 border border-slate-200/60 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-white/15 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    {option.icon}
                  </div>

                  <div className="flex-1 text-left">
                    <p
                      className={`font-medium text-[13px] ${
                        isSelected ? 'text-white' : 'text-slate-800'
                      }`}
                    >
                      {option.label}
                      {count !== undefined && count > 0 && (
                        <span
                          className={`ml-1.5 text-[11px] ${
                            isSelected ? 'text-white/70' : 'text-slate-400'
                          }`}
                        >
                          ({count})
                        </span>
                      )}
                    </p>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        isSelected ? 'text-white/75' : 'text-slate-500'
                      }`}
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
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    portalRoot
  );
};

export default Top100FilterSheet;
