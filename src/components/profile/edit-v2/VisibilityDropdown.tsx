import React, { useState } from 'react';
import { Lock, Globe, Users, UserCheck, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

export type VisibilityValue = 'public' | 'followers' | 'friends' | 'private';

const VISIBILITY_OPTIONS = [
  { value: 'public' as VisibilityValue, label: 'Everyone', icon: Globe },
  { value: 'followers' as VisibilityValue, label: 'Followers & Friends', icon: Users },
  { value: 'friends' as VisibilityValue, label: 'Friends only', icon: UserCheck },
  { value: 'private' as VisibilityValue, label: 'Only me', icon: Lock },
];

interface VisibilityDropdownProps {
  value: VisibilityValue;
  onChange: (value: VisibilityValue) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const VisibilityDropdown: React.FC<VisibilityDropdownProps> = ({
  value,
  onChange,
  label = 'Visible to',
  disabled = false,
  size = 'sm',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const selectedOption = VISIBILITY_OPTIONS.find(o => o.value === value) || VISIBILITY_OPTIONS[0];
  const Icon = selectedOption.icon;

  const handleSelect = (val: VisibilityValue) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <>
      <div className={className}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'flex items-center gap-1.5 border border-border/60 bg-muted/60 rounded-full transition-colors active:bg-muted',
            size === 'sm' ? 'h-7 px-2.5' : 'h-9 px-4',
            disabled && 'opacity-50 pointer-events-none'
          )}
        >
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {label}:
          </span>
          <span className="text-xs font-medium text-foreground">
            {selectedOption.label}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
        </button>
      </div>

      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/40 z-[300]"
                onClick={() => setOpen(false)}
              />
              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-[301] bg-background rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
              >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
                </div>

                {/* Title */}
                <p className="text-sm font-semibold text-foreground text-center py-2">
                  {label}
                </p>

                {/* Options */}
                <div className="pb-4">
                  {VISIBILITY_OPTIONS.map((option) => {
                    const OptionIcon = option.icon;
                    const isSelected = option.value === value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          'w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors active:bg-muted min-h-[52px]',
                          isSelected && 'bg-muted/60'
                        )}
                      >
                        <OptionIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="flex-1 text-sm font-medium text-foreground">
                          {option.label}
                        </span>
                        {isSelected && (
                          <span className="text-primary font-semibold text-sm">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export const visibilityLabel = (v: VisibilityValue) =>
  VISIBILITY_OPTIONS.find(o => o.value === v)?.label || 'Everyone';
