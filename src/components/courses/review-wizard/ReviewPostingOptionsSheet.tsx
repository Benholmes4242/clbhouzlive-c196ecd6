/**
 * ReviewPostingOptionsSheet - Account & Visibility selection for Reviews
 * 
 * Key difference from PostingOptionsSheet:
 * - Business accounts are DISABLED (grayed out) for reviews
 * - Only personal profiles can write course reviews
 * 
 * A* Polish: tokens, color-coded visibility, radio animations,
 * consistent card treatment, removed Info icon on disabled row
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Users, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/ui/haptics';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ActiveActor } from '@/context/ActiveActorContext';

export type ReviewVisibility = 'anyone' | 'followers' | 'private';

interface VisibilityOption {
  value: ReviewVisibility;
  label: string;
  description: string;
  icon: React.ReactNode;
  /** Color classes for the icon circle when selected */
  selectedColor: string;
  /** Color classes for the icon circle when unselected */
  defaultColor: string;
}

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value: 'anyone',
    label: 'Anyone',
    description: 'Visible to everyone on Clbhouz',
    icon: <Globe className="w-5 h-5" />,
    selectedColor: 'bg-emerald-100 text-emerald-600',
    defaultColor: 'bg-muted/50 text-muted-foreground',
  },
  {
    value: 'followers',
    label: 'Followers',
    description: 'Only your followers can see this',
    icon: <Users className="w-5 h-5" />,
    selectedColor: 'bg-amber-100 text-amber-600',
    defaultColor: 'bg-muted/50 text-muted-foreground',
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Visible only to you',
    icon: <Lock className="w-5 h-5" />,
    selectedColor: 'bg-muted text-muted-foreground',
    defaultColor: 'bg-muted/50 text-muted-foreground',
  },
];

interface ReviewPostingOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedActor: ActiveActor | null;
  availableActors: ActiveActor[];
  onActorChange: (actor: ActiveActor) => void;
  visibility: ReviewVisibility;
  onVisibilityChange: (visibility: ReviewVisibility) => void;
}

/**
 * Check if an actor can write reviews
 * Business accounts CANNOT review courses
 */
function canActorReview(actor: ActiveActor): boolean {
  return actor.type === 'personal';
}

/** Radio dot with spring animation */
function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div
      className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 border-2",
        selected
          ? "border-primary bg-primary"
          : "border-muted-foreground/30 bg-transparent"
      )}
    >
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="w-2 h-2 rounded-full bg-white"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function ReviewPostingOptionsSheet({
  isOpen,
  onClose,
  selectedActor,
  availableActors,
  onActorChange,
  visibility,
  onVisibilityChange,
}: ReviewPostingOptionsSheetProps) {
  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  const handleActorSelect = (actor: ActiveActor) => {
    if (!canActorReview(actor)) return;
    triggerHaptic('selection');
    onActorChange(actor);
  };

  const handleVisibilitySelect = (value: ReviewVisibility) => {
    triggerHaptic('selection');
    onVisibilityChange(value);
  };

  const handleDone = () => {
    triggerHaptic('light');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="light fixed inset-0 z-[10000]"
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
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden bg-card"
          style={{ 
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            maxHeight: '85vh',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
            {/* Account Section */}
            <div className="px-5 pt-3 pb-4">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Account
              </h3>
              
              <div className="space-y-1.5">
                {availableActors.map(actor => {
                  const isSelected = selectedActor?.type === actor.type && selectedActor?.id === actor.id;
                  const canReview = canActorReview(actor);
                  
                  return (
                    <motion.button
                      key={`${actor.type}-${actor.id}`}
                      whileTap={canReview ? { scale: 0.98 } : undefined}
                      onClick={() => handleActorSelect(actor)}
                      disabled={!canReview}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                        canReview && isSelected && "bg-primary/5 border border-primary/20",
                        canReview && !isSelected && "bg-muted/10 hover:bg-muted/20",
                        !canReview && "bg-muted/10 opacity-50 cursor-not-allowed"
                      )}
                    >
                      <SquircleAvatar
                        size={40}
                        src={actor.avatarUrl}
                        alt={actor.name}
                        fallback={getInitials(actor.name)}
                        hideRing
                        className={cn(!canReview && "grayscale")}
                      />
                      
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "font-medium text-sm truncate",
                            canReview ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {actor.name}
                          </span>
                          {actor.verified && canReview && <VerifiedBadge size="sm" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {!canReview 
                            ? "Business accounts can't review courses"
                            : 'Personal profile'
                          }
                        </p>
                      </div>
                      
                      {/* Radio indicator — no icon on disabled rows */}
                      {canReview && <RadioDot selected={isSelected} />}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border/30 mx-5" />

            {/* Who Can See Section */}
            <div className="px-5 pt-4 pb-2">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Who can see this?
              </h3>
              
              <div className="space-y-1.5">
                {VISIBILITY_OPTIONS.map(option => {
                  const isSelected = visibility === option.value;
                  
                  return (
                    <motion.button
                      key={option.value}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleVisibilitySelect(option.value)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                        isSelected 
                          ? "bg-primary/5 border border-primary/20"
                          : "bg-muted/10 hover:bg-muted/20"
                      )}
                    >
                      {/* Icon circle — color-coded per visibility level */}
                      <div 
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200",
                          isSelected ? option.selectedColor : option.defaultColor
                        )}
                      >
                        {option.icon}
                      </div>
                      
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm text-foreground">
                          {option.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {option.description}
                        </p>
                      </div>
                      
                      {/* Radio indicator with animation */}
                      <RadioDot selected={isSelected} />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Done Button — primary token */}
          <div className="px-5 pt-3 pb-4 border-t border-border">
            <button
              onClick={handleDone}
              className="w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ReviewPostingOptionsSheet;