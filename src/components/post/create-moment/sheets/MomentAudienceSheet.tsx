import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Users, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MomentVisibility } from '../types';
import { triggerHaptic } from '@/lib/ui/haptics';
import { AnimatedCheck } from '@/components/ui/AnimatedCheck';

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
 * MomentAudienceSheet - Bottom sheet for selecting post visibility
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
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl"
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

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-4">
            <h3 
              className="text-lg font-semibold"
              style={{ color: 'var(--cm-text-primary)' }}
            >
              Who can see this?
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--cm-surface-alt)' }}
            >
              <X className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
            </button>
          </div>

          {/* Options - Tighter spacing */}
          <div className="px-4 pb-4 space-y-1.5">
            {AUDIENCE_OPTIONS.map(option => {
              const isSelected = visibility === option.value;
              
              return (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all",
                    isSelected 
                      ? "bg-[#f8fafc] border border-[#e2e8f0]"
                      : "bg-[#f8fafc] border border-transparent hover:border-[#e2e8f0]"
                  )}
                >
                  <div 
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center",
                      isSelected ? "bg-[#1e293b] text-white" : "bg-white text-[#64748b]"
                    )}
                  >
                    {option.icon}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <p 
                      className={cn(
                        "font-medium text-[13px]",
                        isSelected ? "text-[#1e293b]" : "text-[#64748b]"
                      )}
                    >
                      {option.label}
                    </p>
                    <p 
                      className={cn(
                        "text-[11px] mt-0.5",
                        isSelected ? "text-[#64748b]" : "text-[#94a3b8]"
                      )}
                    >
                      {option.description}
                    </p>
                  </div>
                  
                  {isSelected && (
                    <AnimatedCheck color="#1e293b" />
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
