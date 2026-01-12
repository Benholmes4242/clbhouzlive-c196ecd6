import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Users, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MomentVisibility } from '../types';
import { triggerHaptic } from '@/lib/ui/haptics';

interface AudienceOption {
  value: MomentVisibility;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const AUDIENCE_OPTIONS: AudienceOption[] = [
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

interface MomentAudienceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  visibility: MomentVisibility;
  onVisibilityChange: (visibility: MomentVisibility) => void;
}

/**
 * MomentAudienceSheet - Premium glass bottom sheet for selecting post visibility
 * Options: Anyone (default), Followers, Private
 */
export const MomentAudienceSheet: React.FC<MomentAudienceSheetProps> = ({
  isOpen,
  onClose,
  visibility,
  onVisibilityChange,
}) => {
  const handleSelect = (value: MomentVisibility) => {
    triggerHaptic('selection');
    onVisibilityChange(value);
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
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        
        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="absolute bottom-0 left-0 right-0 rounded-t-[28px]"
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
          <div className="flex items-center justify-between px-5 pb-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--cm-text-primary)' }}>
                Who can see this?
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--cm-text-tertiary)' }}>
                You can change this later from the post menu
              </p>
            </div>
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

          {/* Options */}
          <div className="px-5 pb-6 space-y-2">
            {AUDIENCE_OPTIONS.map(option => {
              const isSelected = visibility === option.value;
              
              return (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(option.value)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all"
                  style={{
                    background: isSelected 
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))'
                      : 'var(--cm-surface-alt)',
                    border: isSelected 
                      ? '1.5px solid rgba(245, 158, 11, 0.4)' 
                      : '1px solid var(--cm-border-subtle)',
                    boxShadow: isSelected 
                      ? '0 0 16px rgba(245, 158, 11, 0.1)' 
                      : 'none',
                  }}
                >
                  <div 
                    className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ 
                      background: isSelected 
                        ? 'rgba(245, 158, 11, 0.15)' 
                        : 'var(--cm-surface-card)',
                      color: isSelected ? '#f59e0b' : 'var(--cm-icon-primary)',
                    }}
                  >
                    {option.icon}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <p 
                      className="font-medium text-sm"
                      style={{ color: isSelected ? '#f59e0b' : 'var(--cm-text-primary)' }}
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
                  
                  {isSelected && (
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MomentAudienceSheet;
