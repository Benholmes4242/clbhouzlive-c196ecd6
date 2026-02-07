import React, { useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOMENT_BADGES, getBadgeById, type BadgeTier } from '../categoryDefinitions';
import { getBadgeIcon } from '@/components/post/badges/AchievementBadgeIcon';
import { haptic } from '@/utils/haptics';

const MAX_BADGES = 2;

/** Category section labels & order */
const CATEGORY_SECTIONS = [
  { key: 'scoring' as const, label: 'Score Milestones' },
  { key: 'shot' as const, label: 'Shot Achievements' },
  { key: 'performance' as const, label: 'Round Performance' },
  { key: 'experience' as const, label: 'Experience' },
];

/** Tier-based icon circle colors */
const TIER_COLORS: Record<BadgeTier, { bg: string; text: string; cardTint?: string }> = {
  legendary:   { bg: 'bg-amber-100',   text: 'text-amber-600',  cardTint: 'bg-amber-50/30' },
  achievement: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  milestone:   { bg: 'bg-blue-100',    text: 'text-blue-600' },
  experience:  { bg: 'bg-slate-100',   text: 'text-slate-500' },
};

interface MomentBadgesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBadges: string[];
  onBadgesChange: (badges: string[]) => void;
}

/**
 * MomentBadgesSheet - Bottom sheet for selecting achievement badges
 * V2: Tier visual hierarchy, category grouping, descriptions, differentiated icons
 * Max 2 selections
 */
export const MomentBadgesSheet: React.FC<MomentBadgesSheetProps> = ({
  isOpen,
  onClose,
  selectedBadges,
  onBadgesChange,
}) => {
  const flashRef = useRef<Map<string, number>>(new Map());

  const toggleBadge = useCallback((badgeId: string) => {
    if (selectedBadges.includes(badgeId)) {
      onBadgesChange(selectedBadges.filter(id => id !== badgeId));
    } else if (selectedBadges.length < MAX_BADGES) {
      onBadgesChange([...selectedBadges, badgeId]);
      haptic('light');
      // Track flash animation
      flashRef.current.set(badgeId, Date.now());
    }
  }, [selectedBadges, onBadgesChange]);

  // Group badges by category
  const groupedBadges = useMemo(() => {
    return CATEGORY_SECTIONS.map(section => ({
      ...section,
      badges: MOMENT_BADGES.filter(b => b.category === section.key),
    }));
  }, []);

  if (!isOpen) return null;

  const atMax = selectedBadges.length >= MAX_BADGES;
  const hasSelections = selectedBadges.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] light"
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
          className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl flex flex-col max-h-[85vh]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header with counter */}
          <div className="flex items-center justify-between px-4 pb-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-foreground">
                Add Achievement Badge
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {/* Selection counter */}
              <span 
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full transition-colors",
                  atMax
                    ? "bg-amber-100 text-amber-700 font-semibold"
                    : hasSelections
                      ? "bg-muted/50 text-primary font-semibold"
                      : "bg-muted/50 text-muted-foreground"
                )}
              >
                {selectedBadges.length}/{MAX_BADGES}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/50"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="px-4 pb-3 text-sm text-muted-foreground">
            Celebrate your achievement. Select up to {MAX_BADGES} badges.
          </p>

          {/* Badge grid - scrollable, grouped by category */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {groupedBadges.map((section) => (
              <div key={section.key} className="mb-4 last:mb-0">
                {/* Section header */}
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-2 px-0.5">
                  {section.label}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {section.badges.map(badge => {
                    const isSelected = selectedBadges.includes(badge.id);
                    const isDisabled = !isSelected && atMax;
                    const IconComponent = getBadgeIcon(badge.id);
                    const tierStyle = TIER_COLORS[badge.tier];
                    
                    return (
                      <motion.button
                        key={badge.id}
                        whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                        onClick={() => !isDisabled && toggleBadge(badge.id)}
                        disabled={isDisabled}
                        className={cn(
                          "relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                          isSelected 
                            ? "bg-primary/10 ring-2 ring-primary/50"
                            : tierStyle.cardTint 
                              ? `${tierStyle.cardTint} hover:bg-muted/50`
                              : "bg-muted/30 hover:bg-muted/50",
                          isDisabled && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        {/* Selected checkmark with bounce animation */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ type: 'spring', damping: 12, stiffness: 400 }}
                              className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                            >
                              <Check className="w-2.5 h-2.5 text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Flash pulse on selection */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0.3, scale: 1 }}
                              animate={{ opacity: 0, scale: 1.15 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.4 }}
                              className="absolute inset-0 rounded-xl bg-primary/20 pointer-events-none"
                            />
                          )}
                        </AnimatePresence>
                        
                        {/* Icon container — tier-colored */}
                        <div 
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                            isSelected 
                              ? "bg-primary/20 text-primary" 
                              : `${tierStyle.bg} ${tierStyle.text}`
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

                        {/* Description — only on selected cards */}
                        <AnimatePresence>
                          {isSelected && badge.description && (
                            <motion.span
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-[10px] text-muted-foreground text-center leading-tight overflow-hidden"
                            >
                              {badge.description}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Done / Skip button */}
          <div className="px-4 pt-2 pb-2">
            <button
              onClick={onClose}
              className="w-full h-11 rounded-xl font-semibold text-sm transition-all bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {hasSelections ? 'Done' : 'Skip'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MomentBadgesSheet;
