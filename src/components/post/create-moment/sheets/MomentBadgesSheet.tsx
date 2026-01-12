import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Check, Sparkles } from 'lucide-react';
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
 * MomentBadgesSheet - Premium gamification sheet for achievement badges
 * Collectible-style tiles with glow effects
 */
export const MomentBadgesSheet: React.FC<MomentBadgesSheetProps> = ({
  isOpen,
  onClose,
  selectedBadges,
  onBadgesChange,
}) => {
  const toggleBadge = (badgeId: string) => {
    if (selectedBadges.includes(badgeId)) {
      onBadgesChange(selectedBadges.filter(id => id !== badgeId));
    } else if (selectedBadges.length < MAX_BADGES) {
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
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        
        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="absolute bottom-0 left-0 right-0 rounded-t-[28px] flex flex-col max-h-[85vh]"
          style={{ 
            background: 'var(--cm-surface-card)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.12)',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-slate-300/60" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-2">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.1))',
                }}
              >
                <Award className="w-5 h-5" style={{ color: '#fbbf24' }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--cm-text-primary)' }}>
                  Add Achievement Badge
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span 
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ 
                  background: atMax 
                    ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.1))' 
                    : 'var(--cm-surface-alt)',
                  color: atMax ? '#fbbf24' : 'var(--cm-text-secondary)',
                  border: atMax ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid var(--cm-border-subtle)',
                }}
              >
                {selectedBadges.length}/{MAX_BADGES}
              </span>
              <button
                onClick={onClose}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center",
                  "bg-slate-100/80 dark:bg-slate-800/80",
                  "backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50",
                  "transition-all duration-200 active:scale-95"
                )}
              >
                <X className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="px-5 pb-4 text-sm" style={{ color: 'var(--cm-text-secondary)' }}>
            Show it on your post • Earn more by playing & reviewing courses
          </p>

          {/* Badge Grid */}
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <div className="grid grid-cols-3 gap-3">
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
                      "relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all",
                      isDisabled && "opacity-40 cursor-not-allowed"
                    )}
                    style={{
                      background: isSelected 
                        ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05))'
                        : 'var(--cm-surface-alt)',
                      border: isSelected 
                        ? '1.5px solid rgba(251, 191, 36, 0.5)' 
                        : '1px solid var(--cm-border-subtle)',
                      boxShadow: isSelected 
                        ? '0 0 20px rgba(251, 191, 36, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                        : 'none',
                    }}
                  >
                    {/* Selected checkmark */}
                    {isSelected && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                    
                    {/* Icon */}
                    <div 
                      className="w-10 h-10 flex items-center justify-center"
                      style={{ color: isSelected ? '#fbbf24' : 'var(--cm-text-primary)' }}
                    >
                      {IconComponent ? (
                        <IconComponent className="w-7 h-7" />
                      ) : (
                        <Award className="w-7 h-7" />
                      )}
                    </div>
                    
                    {/* Label */}
                    <span 
                      className="text-xs font-medium text-center leading-tight"
                      style={{ color: isSelected ? '#fbbf24' : 'var(--cm-text-primary)' }}
                    >
                      {badge.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Done Button */}
          <div className="px-5 pt-2 pb-4">
            <button
              onClick={onClose}
              className={cn(
                "w-full h-12 rounded-2xl font-semibold text-base",
                "transition-all duration-200 active:scale-[0.98]"
              )}
              style={{
                background: selectedBadges.length > 0 
                  ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' 
                  : 'var(--cm-surface-slate)',
                color: 'white',
                boxShadow: selectedBadges.length > 0 
                  ? '0 4px 16px rgba(251, 191, 36, 0.25)' 
                  : '0 4px 12px rgba(0, 0, 0, 0.15)',
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
