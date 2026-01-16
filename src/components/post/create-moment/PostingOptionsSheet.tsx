import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Users, Lock, Check } from 'lucide-react';
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
}

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value: 'anyone',
    label: 'Anyone',
    description: 'Visible to everyone on Clbhouz',
    icon: <Globe className="w-5 h-5" />,
  },
  {
    value: 'followers',
    label: 'Followers',
    description: 'Only your followers can see this',
    icon: <Users className="w-5 h-5" />,
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Visible only to you',
    icon: <Lock className="w-5 h-5" />,
  },
];

interface PostingOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Currently selected posting identity */
  selectedActor: ActiveActor | null;
  /** All available identities to choose from */
  availableActors: ActiveActor[];
  /** Callback when identity changes (local override for this post only) */
  onActorChange: (actor: ActiveActor) => void;
  /** Current visibility setting */
  visibility: MomentVisibility;
  /** Callback when visibility changes */
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
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden"
          style={{ 
            background: 'var(--cm-surface-card)',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            maxHeight: '85vh',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[#d1d5db]" />
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
            {/* Posting As Section */}
            <div className="px-4 pt-3 pb-4">
              <h3 
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: 'var(--cm-text-tertiary)' }}
              >
                Posting as
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
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                        isSelected 
                          ? "bg-[#f1f5f9]"
                          : "hover:bg-[#f8fafc]"
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
                          <span 
                            className="font-medium truncate"
                            style={{ color: 'var(--cm-text-primary)' }}
                          >
                            {actor.name}
                          </span>
                          {actor.verified && <VerifiedBadge size="sm" />}
                        </div>
                        <p 
                          className="text-xs mt-0.5"
                          style={{ color: 'var(--cm-text-tertiary)' }}
                        >
                          {actor.type === 'personal' ? 'Personal profile' : 'Business account'}
                        </p>
                      </div>
                      
                      {/* Radio indicator */}
                      <div 
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                          isSelected 
                            ? "border-[#1e293b] bg-[#1e293b]"
                            : "border-[#d1d5db] bg-transparent"
                        )}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#e2e8f0] mx-4" />

            {/* Who Can See Section */}
            <div className="px-4 pt-4 pb-2">
              <h3 
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: 'var(--cm-text-tertiary)' }}
              >
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
                          ? "bg-[#f1f5f9]"
                          : "hover:bg-[#f8fafc]"
                      )}
                    >
                      {/* Icon circle */}
                      <div 
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                          isSelected 
                            ? "bg-[#1e293b] text-white" 
                            : "bg-[#f1f5f9] text-[#64748b]"
                        )}
                      >
                        {option.icon}
                      </div>
                      
                      <div className="flex-1 text-left">
                        <p 
                          className="font-medium text-sm"
                          style={{ color: 'var(--cm-text-primary)' }}
                        >
                          {option.label}
                        </p>
                        <p 
                          className="text-xs mt-0.5"
                          style={{ color: 'var(--cm-text-tertiary)' }}
                        >
                          {option.description}
                        </p>
                      </div>
                      
                      {/* Radio indicator */}
                      <div 
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                          isSelected 
                            ? "border-[#1e293b] bg-[#1e293b]"
                            : "border-[#d1d5db] bg-transparent"
                        )}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Done Button */}
          <div className="px-4 pt-3 pb-2">
            <button
              onClick={handleDone}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
              style={{
                background: '#1e293b',
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
}

export default PostingOptionsSheet;
