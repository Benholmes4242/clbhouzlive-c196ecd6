import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Users, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MomentVisibility } from '../types';

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
    description: 'Only you can see this moment',
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
 * Options: Anyone (default), Connections, Private
 */
export const MomentAudienceSheet: React.FC<MomentAudienceSheetProps> = ({
  isOpen,
  onClose,
  visibility,
  onVisibilityChange,
}) => {
  const handleSelect = (value: MomentVisibility) => {
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
          className="absolute bottom-0 left-0 right-0 rounded-t-2xl"
          style={{ 
            background: 'var(--cm-surface-card)',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div 
              className="w-10 h-1 rounded-full"
              style={{ background: 'var(--cm-border)' }}
            />
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

          {/* Options */}
          <div className="px-4 pb-4 space-y-2">
            {AUDIENCE_OPTIONS.map(option => {
              const isSelected = visibility === option.value;
              
              return (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(option.value)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                  style={{
                    background: isSelected ? 'var(--cm-surface-slate)' : 'var(--cm-surface-alt)',
                    border: isSelected ? 'none' : '1px solid var(--cm-border-subtle)',
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ 
                      background: isSelected ? 'rgba(255,255,255,0.15)' : 'var(--cm-surface-card)',
                      color: isSelected ? 'white' : 'var(--cm-icon-primary)',
                    }}
                  >
                    {option.icon}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <p 
                      className="font-medium text-sm"
                      style={{ color: isSelected ? 'white' : 'var(--cm-text-primary)' }}
                    >
                      {option.label}
                    </p>
                    <p 
                      className="text-xs mt-0.5"
                      style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--cm-text-tertiary)' }}
                    >
                      {option.description}
                    </p>
                  </div>
                  
                  {isSelected && (
                    <Check className="w-5 h-5 text-white" />
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
