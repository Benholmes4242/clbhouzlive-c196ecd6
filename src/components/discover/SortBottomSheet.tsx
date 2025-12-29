import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Heart, MessageCircle, Users } from 'lucide-react';
import { SortOption } from './DiscoverCommandCenter';
import { triggerHaptic } from '@/lib/ui/haptics';

interface SortOptionItem {
  id: SortOption;
  label: string;
  icon: React.ReactNode;
}

const SORT_OPTIONS: SortOptionItem[] = [
  {
    id: 'newest',
    label: 'Newest first',
    icon: <Clock className="w-5 h-5" />,
  },
  {
    id: 'most-liked',
    label: 'Most liked',
    icon: <Heart className="w-5 h-5" />,
  },
  {
    id: 'most-discussed',
    label: 'Most discussed',
    icon: <MessageCircle className="w-5 h-5" />,
  },
  {
    id: 'friends-first',
    label: 'Friends first',
    icon: <Users className="w-5 h-5" />,
  },
];

interface SortBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sortValue: SortOption;
  onSortChange: (sort: SortOption) => void;
}

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

/**
 * SortBottomSheet - Bottom sheet for selecting sort option
 * Styled to match MomentAudienceSheet (visibility sheet)
 */
export const SortBottomSheet: React.FC<SortBottomSheetProps> = ({
  isOpen,
  onClose,
  sortValue,
  onSortChange,
}) => {
  const handleSelect = (id: SortOption) => {
    triggerHaptic('selection');
    onSortChange(id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000]"
        onClick={onClose}
      >
        {/* Backdrop - bg-black/40, no blur */}
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

          {/* Header - Left title + close X on right */}
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

          {/* Options - px-4 pb-4 content area */}
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
                  {/* Leading icon circle */}
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ 
                      background: isSelected ? 'rgba(255,255,255,0.15)' : 'var(--cm-surface-card)',
                      color: isSelected ? 'white' : 'var(--cm-icon-primary)',
                    }}
                  >
                    {option.icon}
                  </div>
                  
                  {/* Label */}
                  <div className="flex-1 text-left">
                    <p 
                      className="font-medium text-sm"
                      style={{ color: isSelected ? 'white' : 'var(--cm-text-primary)' }}
                    >
                      {option.label}
                    </p>
                  </div>
                  
                  {/* Trailing animated checkmark */}
                  {isSelected && <AnimatedCheck />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SortBottomSheet;
