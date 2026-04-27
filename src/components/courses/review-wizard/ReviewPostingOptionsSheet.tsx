/**
 * ReviewPostingOptionsSheet - Account & Visibility selection for Reviews
 * Dispatch flat-row design with amber active states
 */

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
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
  selectedColor: string;
  defaultColor: string;
}

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value: 'anyone',
    label: 'Anyone',
    description: 'Visible to everyone on clbhouz',
    icon: <Globe className="w-5 h-5" />,
    selectedColor: 'bg-amber-100 text-amber-600',
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
          ? "border-amber-500 bg-amber-500"
          : "border-border bg-transparent"
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
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
        
        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 overflow-hidden"
          style={{ 
            backgroundColor: '#ffffff',
            borderRadius: '20px 20px 0 0',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            maxHeight: '85vh',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.12)' }} />
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
            {/* Account Section */}
            <div style={{ padding: '8px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px 8px' }}>
                <div style={{ width: 3, height: 12, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 8.5, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>Account</span>
              </div>
              
              {availableActors.map(actor => {
                const isSelected = selectedActor?.type === actor.type && selectedActor?.id === actor.id;
                const canReview = canActorReview(actor);
                
                return (
                  <button
                    key={`${actor.type}-${actor.id}`}
                    onClick={() => handleActorSelect(actor)}
                    disabled={!canReview}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px',
                      background: canReview && isSelected ? 'rgba(247,147,30,0.04)' : 'transparent',
                      border: 'none',
                      borderLeft: canReview && isSelected ? '3px solid #F7931E' : '3px solid transparent',
                      borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                      cursor: canReview ? 'pointer' : 'not-allowed',
                      textAlign: 'left' as const,
                      opacity: !canReview ? 0.45 : 1,
                    }}
                  >
                    <SquircleAvatar
                      size={40}
                      src={actor.avatarUrl}
                      alt={actor.name}
                      userId={actor.id}
                      hideRing
                      className={cn(!canReview && "grayscale")}
                    />
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' as const }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: isSelected ? 800 : 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {actor.name}
                        </span>
                        {actor.verified && canReview && <VerifiedBadge size="sm" />}
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                        {!canReview ? "Business accounts can't review courses" : 'Personal profile'}
                      </div>
                    </div>
                    {canReview && <RadioDot selected={isSelected} />}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ height: 0.5, margin: '0 20px', background: 'rgba(15,23,42,0.07)' }} />

            {/* Who Can See Section */}
            <div style={{ padding: '12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px 8px' }}>
                <div style={{ width: 3, height: 12, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 8.5, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>Who Can See</span>
              </div>
              
              {VISIBILITY_OPTIONS.map(option => {
                const isSelected = visibility === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleVisibilitySelect(option.value)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px',
                      background: isSelected ? 'rgba(247,147,30,0.04)' : 'transparent',
                      border: 'none',
                      borderLeft: isSelected ? '3px solid #F7931E' : '3px solid transparent',
                      borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                      cursor: 'pointer', textAlign: 'left' as const,
                    }}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200",
                        isSelected ? option.selectedColor : option.defaultColor
                      )}
                    >
                      {option.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' as const }}>
                      <div style={{ fontSize: 14, fontWeight: isSelected ? 800 : 500, color: '#0F172A' }}>{option.label}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{option.description}</div>
                    </div>
                    {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F7931E', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Done Button */}
          <div style={{ padding: '12px 20px 16px', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
            <button
              onClick={handleDone}
              style={{
                width: '100%', height: 48, borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: '#0F172A', color: '#ffffff', border: 'none', cursor: 'pointer',
              }}
              className="active:scale-[0.98] transition-all"
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
