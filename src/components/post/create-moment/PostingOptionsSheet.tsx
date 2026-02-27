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
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden"
          style={{ maxHeight: '85vh', backgroundColor: '#FFFFFF' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-9 h-1 rounded-full" style={{ backgroundColor: '#E0E0E0' }} />
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
            {/* Account Section */}
            <div className="px-5 pt-3 pb-4">
              <h3
                className="uppercase tracking-wider mb-3"
                style={{ fontSize: '12px', fontWeight: 600, color: '#AEAEB2' }}
              >
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
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                      style={{
                        backgroundColor: isSelected ? 'rgba(245,158,11,0.06)' : 'transparent',
                        border: isSelected ? '1px solid rgba(245,158,11,0.20)' : '1px solid transparent',
                      }}
                    >
                      <div
                        className="rounded-full flex-shrink-0 overflow-hidden"
                        style={{
                          border: isSelected ? '2px solid #f59e0b' : '2px solid transparent',
                          padding: '1px',
                        }}
                      >
                        <SquircleAvatar
                          size={40}
                          src={actor.avatarUrl}
                          alt={actor.name}
                          fallback={getInitials(actor.name)}
                          hideRing
                        />
                      </div>
                      
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="truncate"
                            style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}
                          >
                            {actor.name}
                          </span>
                          {actor.verified && <VerifiedBadge size="sm" />}
                        </div>
                        <p style={{ fontSize: '13px', fontWeight: 400, color: '#7A7A7A', marginTop: '2px' }}>
                          {actor.type === 'personal' ? 'Personal profile' : 'Business account'}
                        </p>
                      </div>
                      
                      {/* Radio indicator */}
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                        style={{
                          border: isSelected ? 'none' : '1.5px solid #E0E0E0',
                          backgroundColor: isSelected ? '#f59e0b' : 'transparent',
                        }}
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

            {/* Divider */}
            <div className="mx-5 h-px" style={{ backgroundColor: 'rgba(0,0,0,0.07)' }} />

            {/* Who Can See Section */}
            <div className="px-5 pt-4 pb-2">
              <h3
                className="uppercase tracking-wider mb-3"
                style={{ fontSize: '12px', fontWeight: 600, color: '#AEAEB2' }}
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
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                      style={{
                        backgroundColor: isSelected ? 'rgba(245,158,11,0.06)' : 'transparent',
                        border: isSelected ? '1px solid rgba(245,158,11,0.20)' : '1px solid transparent',
                      }}
                    >
                      {/* Icon circle */}
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                        style={{
                          backgroundColor: isSelected ? 'rgba(245,158,11,0.10)' : 'rgba(0,0,0,0.04)',
                          color: isSelected ? '#f59e0b' : '#AEAEB2',
                        }}
                      >
                        {option.icon}
                      </div>
                      
                      <div className="flex-1 text-left">
                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                          {option.label}
                        </p>
                        <p style={{ fontSize: '13px', fontWeight: 400, color: '#7A7A7A', marginTop: '2px' }}>
                          {option.description}
                        </p>
                      </div>
                      
                      {/* Radio indicator */}
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                        style={{
                          border: isSelected ? 'none' : '1.5px solid #E0E0E0',
                          backgroundColor: isSelected ? '#f59e0b' : 'transparent',
                        }}
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

          {/* Done Button */}
          <div 
            className="px-5 pt-3"
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
              borderTop: '0.5px solid rgba(0,0,0,0.07)',
            }}
          >
            <button
              onClick={handleDone}
              className="w-full h-12 font-semibold transition-all duration-200 active:scale-[0.98]"
              style={{
                backgroundColor: '#f59e0b',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 600,
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(245,158,11,0.22)',
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
