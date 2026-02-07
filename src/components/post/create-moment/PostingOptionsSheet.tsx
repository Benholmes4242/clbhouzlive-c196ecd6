import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Users, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/ui/haptics';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ActiveActor } from '@/context/ActiveActorContext';
import { MomentVisibility } from './types';

interface VisibilityOption {
  value: MomentVisibility;
  label: string;
  description: string;
  icon: React.ReactNode;
  /** Color tokens for contextual meaning */
  color: {
    bg: string;
    bgSelected: string;
    text: string;
  };
}

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value: 'anyone',
    label: 'Anyone',
    description: 'Visible to everyone on Clbhouz',
    icon: <Globe className="w-5 h-5" />,
    color: {
      bg: 'rgba(16, 185, 129, 0.08)',       // emerald-500 / 8%
      bgSelected: 'rgba(16, 185, 129, 0.15)', // emerald-500 / 15%
      text: '#059669',                        // emerald-600
    },
  },
  {
    value: 'followers',
    label: 'Followers',
    description: 'Only your followers can see this',
    icon: <Users className="w-5 h-5" />,
    color: {
      bg: 'rgba(245, 158, 11, 0.08)',        // amber-500 / 8%
      bgSelected: 'rgba(245, 158, 11, 0.15)', // amber-500 / 15%
      text: '#d97706',                         // amber-600
    },
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Visible only to you',
    icon: <Lock className="w-5 h-5" />,
    color: {
      bg: 'rgba(100, 116, 139, 0.08)',        // slate-500 / 8%
      bgSelected: 'rgba(100, 116, 139, 0.15)', // slate-500 / 15%
      text: '#64748b',                          // slate-500
    },
  },
];

interface PostingOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedActor: ActiveActor | null;
  availableActors: ActiveActor[];
  onActorChange: (actor: ActiveActor) => void;
  visibility: MomentVisibility;
  onVisibilityChange: (visibility: MomentVisibility) => void;
}

/**
 * PostingOptionsSheet - Combined bottom sheet for "Posting As" and "Who Can See"
 * Allows user to select posting identity and visibility in one place
 */
export function PostingOptionsSheet({
  isOpen,
  onClose,
  selectedActor,
  availableActors,
  onActorChange,
  visibility,
  onVisibilityChange,
}: PostingOptionsSheetProps) {
  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  const handleActorSelect = (actor: ActiveActor) => {
    triggerHaptic('selection');
    onActorChange(actor);
  };

  const handleVisibilitySelect = (value: MomentVisibility) => {
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
      {/* P1: Add .light class so all children inherit correct theme tokens */}
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
          className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl overflow-hidden"
          style={{ maxHeight: '85vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle — semantic token */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
            {/* Account Section */}
            <div className="px-5 pt-3 pb-4">
              <h3 className="text-xs font-medium text-primary uppercase tracking-wide mb-3">
                Account
              </h3>
              
              <div className="space-y-1.5">
                {availableActors.map(actor => {
                  const isSelected = selectedActor?.type === actor.type && selectedActor?.id === actor.id;
                  
                  return (
                    <motion.button
                      key={`${actor.type}-${actor.id}`}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleActorSelect(actor)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                        isSelected 
                          ? "bg-primary/5 border border-primary/20"
                          : "bg-muted/10 border border-transparent hover:bg-muted/20"
                      )}
                    >
                      <SquircleAvatar
                        size={40}
                        src={actor.avatarUrl}
                        alt={actor.name}
                        fallback={getInitials(actor.name)}
                        hideRing
                      />
                      
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm text-foreground truncate">
                            {actor.name}
                          </span>
                          {actor.verified && <VerifiedBadge size="sm" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {actor.type === 'personal' ? 'Personal profile' : 'Business account'}
                        </p>
                      </div>
                      
                      {/* Radio indicator with animated inner dot */}
                      <div 
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 border-2",
                          isSelected 
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30 bg-transparent"
                        )}
                      >
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                              className="w-2 h-2 rounded-full bg-white"
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Divider — consistent padding */}
            <div className="mx-5 h-px bg-border" />

            {/* Who Can See Section */}
            <div className="px-5 pt-4 pb-2">
              <h3 className="text-xs font-medium text-primary uppercase tracking-wide mb-3">
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
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                        isSelected 
                          ? "bg-primary/5 border border-primary/20"
                          : "bg-muted/10 border border-transparent hover:bg-muted/20"
                      )}
                    >
                      {/* Icon circle — contextual color coding */}
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                        style={{
                          backgroundColor: isSelected ? option.color.bgSelected : option.color.bg,
                          color: option.color.text,
                        }}
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
                      
                      {/* Radio indicator with animated inner dot */}
                      <div 
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 border-2",
                          isSelected 
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30 bg-transparent"
                        )}
                      >
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                              className="w-2 h-2 rounded-full bg-white"
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Done Button — brand primary, safe-area aware */}
          <div 
            className="px-5 pt-3 border-t border-border"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
          >
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

export default PostingOptionsSheet;
