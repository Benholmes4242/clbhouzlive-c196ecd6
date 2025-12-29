import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { triggerHaptic } from '@/lib/ui/haptics';

interface StandardBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * StandardBottomSheet - Unified bottom sheet matching Visibility sheet design
 * 
 * Features:
 * - Backdrop: bg-black/40 (no blur)
 * - Sheet: rounded-t-2xl, var(--cm-surface-card)
 * - Handle: w-10 h-1 rounded-full
 * - Header: Left-aligned title + close X button
 * - Entry animation: spring (damping: 28, stiffness: 300)
 * - Safe area handling for iOS
 */
export const StandardBottomSheet: React.FC<StandardBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="bottom-sheet-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000]"
          onClick={onClose}
        >
          {/* Backdrop - matches Visibility sheet: bg-black/40, no blur */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`absolute bottom-0 left-0 right-0 rounded-t-2xl ${className || ''}`}
            style={{ 
              background: 'var(--cm-surface-card)',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle - matches Visibility sheet */}
            <div className="flex justify-center pt-3 pb-2">
              <div 
                className="w-10 h-1 rounded-full"
                style={{ background: 'var(--cm-border)' }}
              />
            </div>

            {/* Header - Left-aligned title + close X (matches Visibility sheet) */}
            <div className="flex items-center justify-between px-4 pb-3">
              <div>
                <h3 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--cm-text-primary)' }}
                >
                  {title}
                </h3>
                {subtitle && (
                  <p 
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--cm-text-tertiary)' }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--cm-surface-alt)' }}
              >
                <X className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Animated checkmark with draw-in effect (matches Visibility sheet)
export const AnimatedCheck: React.FC = () => (
  <motion.svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    initial="hidden"
    animate="visible"
  >
    <motion.path
      d="M4 10L8 14L16 6"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      variants={{
        hidden: { pathLength: 0, opacity: 0 },
        visible: { 
          pathLength: 1, 
          opacity: 1,
          transition: { 
            pathLength: { duration: 0.3, ease: "easeOut" },
            opacity: { duration: 0.1 }
          }
        }
      }}
    />
  </motion.svg>
);

interface SheetOptionRowProps {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
}

/**
 * SheetOptionRow - Unified option row matching Visibility sheet design
 * 
 * Features:
 * - Card-style rows with bg/border/shadow
 * - Selected state: slate bg + drop shadow
 * - Icon circle: w-10 h-10 rounded-full
 * - Animated checkmark on selection
 * - Haptic feedback
 */
export const SheetOptionRow: React.FC<SheetOptionRowProps> = ({
  label,
  description,
  selected,
  onSelect,
  icon,
}) => {
  const handleClick = () => {
    triggerHaptic('selection');
    onSelect();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
      style={{
        background: selected 
          ? 'var(--cm-surface-slate)' 
          : 'var(--cm-surface-alt)',
        border: selected 
          ? 'none' 
          : '1px solid var(--cm-border-subtle)',
        boxShadow: selected 
          ? '0 2px 8px rgba(0, 0, 0, 0.12)' 
          : 'none',
      }}
    >
      {/* Icon circle */}
      {icon && (
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ 
            background: selected ? 'rgba(255,255,255,0.15)' : 'var(--cm-surface-card)',
            color: selected ? 'white' : 'var(--cm-icon-primary)',
          }}
        >
          {icon}
        </div>
      )}
      
      {/* Text content */}
      <div className="flex-1 text-left">
        <p 
          className="font-medium text-sm"
          style={{ color: selected ? 'white' : 'var(--cm-text-primary)' }}
        >
          {label}
        </p>
        {description && (
          <p 
            className="text-xs mt-0.5"
            style={{ color: selected ? 'rgba(255,255,255,0.7)' : 'var(--cm-text-tertiary)' }}
          >
            {description}
          </p>
        )}
      </div>
      
      {/* Animated checkmark */}
      {selected && <AnimatedCheck />}
    </motion.button>
  );
};

export default StandardBottomSheet;