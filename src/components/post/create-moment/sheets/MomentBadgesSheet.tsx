import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOMENT_BADGES, getBadgeById } from '../categoryDefinitions';

const MAX_BADGES = 2;

interface MomentBadgesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBadges: string[];
  onBadgesChange: (badges: string[]) => void;
}

/**
 * MomentBadgesSheet - Bottom sheet for selecting moment badges
 * Eagle/Birdie/HIO/PB/Breaking scores
 * Optional, max 2
 */
export const MomentBadgesSheet: React.FC<MomentBadgesSheetProps> = ({
  isOpen,
  onClose,
  selectedBadges,
  onBadgesChange,
}) => {
  // Toggle badge selection
  const toggleBadge = (badgeId: string) => {
    if (selectedBadges.includes(badgeId)) {
      // Remove badge
      onBadgesChange(selectedBadges.filter(id => id !== badgeId));
    } else if (selectedBadges.length < MAX_BADGES) {
      // Add badge
      onBadgesChange([...selectedBadges, badgeId]);
    }
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
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 rounded-t-2xl flex flex-col"
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
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" style={{ color: 'var(--cm-accent-gold)' }} />
              <h3 
                className="text-lg font-semibold"
                style={{ color: 'var(--cm-text-primary)' }}
              >
                Add a badge
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--cm-surface-alt)' }}
            >
              <X className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
            </button>
          </div>

          {/* Description */}
          <p 
            className="px-4 pb-4 text-sm"
            style={{ color: 'var(--cm-text-secondary)' }}
          >
            Celebrate your achievements! Select up to {MAX_BADGES} badges.
          </p>

          {/* Selected badges */}
          {selectedBadges.length > 0 && (
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {selectedBadges.map(badgeId => {
                  const badge = getBadgeById(badgeId);
                  if (!badge) return null;
                  return (
                    <motion.button
                      key={badge.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      onClick={() => toggleBadge(badge.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                      style={{
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))',
                        border: '1px solid rgba(251, 191, 36, 0.4)',
                        color: 'var(--cm-text-primary)',
                      }}
                    >
                      <span>{badge.emoji}</span>
                      <span>{badge.label}</span>
                      <X className="w-3.5 h-3.5 opacity-70" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Badge options */}
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {MOMENT_BADGES.map(badge => {
                const isSelected = selectedBadges.includes(badge.id);
                const isDisabled = !isSelected && selectedBadges.length >= MAX_BADGES;
                
                return (
                  <motion.button
                    key={badge.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleBadge(badge.id)}
                    disabled={isDisabled}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-colors",
                      isDisabled && "opacity-40 cursor-not-allowed"
                    )}
                    style={{
                      background: isSelected 
                        ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))'
                        : 'var(--cm-surface-alt)',
                      border: isSelected 
                        ? '1px solid rgba(251, 191, 36, 0.4)' 
                        : '1px solid var(--cm-border-subtle)',
                      color: 'var(--cm-text-primary)',
                    }}
                  >
                    <span>{badge.emoji}</span>
                    <span>{badge.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Done button */}
          <div className="px-4 pt-2">
            <button
              onClick={onClose}
              className="w-full h-11 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: 'var(--cm-surface-slate)',
                color: 'white',
              }}
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MomentBadgesSheet;
