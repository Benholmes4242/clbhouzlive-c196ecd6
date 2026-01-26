import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOMENT_BADGES, getBadgeById } from '../categoryDefinitions';
import { getBadgeIcon } from '@/components/post/badges/AchievementBadgeIcon';

const MAX_BADGES = 2;

interface MomentBadgesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBadges: string[];
  onBadgesChange: (badges: string[]) => void;
}

/**
 * MomentBadgesSheet - Bottom sheet for selecting achievement badges
 * V1: 15 badges across scoring, shot, performance, experience categories
 * Max 2 selections
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

  const atMax = selectedBadges.length >= MAX_BADGES;

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
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl flex flex-col max-h-[85vh]"
          style={{ 
            background: 'var(--cm-surface-card)',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-[#e2e8f0]" />
          </div>

          {/* Header with counter */}
          <div className="flex items-center justify-between px-4 pb-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" style={{ color: 'var(--cm-accent-gold)' }} />
              <h3 
                className="text-lg font-semibold"
                style={{ color: 'var(--cm-text-primary)' }}
              >
                Add Achievement Badge
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {/* Selection counter */}
              <span 
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ 
                  background: atMax ? 'rgba(251, 191, 36, 0.2)' : 'var(--cm-surface-alt)',
                  color: atMax ? 'var(--cm-accent-gold)' : 'var(--cm-text-secondary)',
                }}
              >
                {selectedBadges.length}/{MAX_BADGES}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--cm-surface-alt)' }}
              >
                <X className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
              </button>
            </div>
          </div>

          {/* Description */}
          <p 
            className="px-4 pb-3 text-sm"
            style={{ color: 'var(--cm-text-secondary)' }}
          >
            Celebrate your achievement. Select up to {MAX_BADGES} badges.
          </p>

          {/* Badge grid - scrollable */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="grid grid-cols-3 gap-2">
              {MOMENT_BADGES.map(badge => {
                const isSelected = selectedBadges.includes(badge.id);
                const isDisabled = !isSelected && atMax;
                const IconComponent = getBadgeIcon(badge.id);
                
                return (
                  <motion.button
                    key={badge.id}
                    whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                    onClick={() => !isDisabled && toggleBadge(badge.id)}
                    disabled={isDisabled}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                      isSelected 
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : "bg-muted/30 hover:bg-muted/50",
                      isDisabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {/* Selected checkmark - unified with Categories */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    
                    {/* Icon container */}
                    <div 
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        isSelected 
                          ? "bg-primary/20 text-primary" 
                          : "bg-background text-muted-foreground"
                      )}
                    >
                      {IconComponent ? (
                        <IconComponent className="w-5 h-5" />
                      ) : (
                        <Award className="w-5 h-5" />
                      )}
                    </div>
                    
                    {/* Label */}
                    <span 
                      className={cn(
                        "text-xs font-medium text-center leading-tight",
                        isSelected ? "text-primary" : "text-foreground"
                      )}
                    >
                      {badge.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Done button - unified dark style */}
          <div className="px-4 pt-2 pb-2">
            <button
              onClick={onClose}
              className="w-full h-11 rounded-xl font-semibold text-sm transition-all bg-foreground text-background hover:bg-foreground/90"
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
