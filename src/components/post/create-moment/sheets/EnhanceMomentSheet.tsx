import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Wand2, Film, ChevronRight, Award } from 'lucide-react';

interface EnhanceOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  isPremium?: boolean;
  comingSoon?: boolean;
  requiresMultipleVideos?: boolean;
}

const ENHANCE_OPTIONS: EnhanceOption[] = [
  {
    id: 'filters',
    label: 'Filters & Effects',
    description: 'Apply beautiful filters to your media',
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: 'badges',
    label: 'Add Achievement Badge',
    description: 'Eagle, Birdie, Personal Best & more',
    icon: <Award className="w-5 h-5" />,
  },
  {
    id: 'smart-compilation',
    label: 'Smart Compilation',
    description: 'Merge multiple clips into one video',
    icon: <Film className="w-5 h-5" />,
    requiresMultipleVideos: true,
    comingSoon: true,
  },
  {
    id: 'magic-enhance',
    label: 'Magic Enhance',
    description: 'Auto-enhance your photos',
    icon: <Wand2 className="w-5 h-5" />,
    comingSoon: true,
  },
];

interface EnhanceMomentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStudio: () => void;
  onOpenBadges?: () => void;
  
  onOpenSmartCompilation?: () => void;
  videoCount?: number;
}

/**
 * EnhanceMomentSheet - Bottom sheet for optional enhancements
 * All tools are optional - closing returns to canvas unchanged
 */
export const EnhanceMomentSheet: React.FC<EnhanceMomentSheetProps> = ({
  isOpen,
  onClose,
  onOpenStudio,
  onOpenBadges,
  
  onOpenSmartCompilation,
  videoCount = 0,
}) => {
  // Filter options based on video count
  const filteredOptions = useMemo(() => {
    return ENHANCE_OPTIONS.filter(option => {
      // Hide Smart Compilation if less than 2 videos
      if (option.requiresMultipleVideos && videoCount < 2) {
        return false;
      }
      return true;
    });
  }, [videoCount]);

  const handleOptionClick = (optionId: string) => {
    if (optionId === 'filters') {
      onClose();
      onOpenStudio();
    } else if (optionId === 'badges' && onOpenBadges) {
      onClose();
      onOpenBadges();
    } else if (optionId === 'smart-compilation' && onOpenSmartCompilation) {
      onClose();
      onOpenSmartCompilation();
    }
    // Other options are coming soon - no action
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
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: 'var(--cm-accent)' }} />
              <h3 
                className="text-lg font-semibold"
                style={{ color: 'var(--cm-text-primary)' }}
              >
                Enhance your moment
              </h3>
            </div>
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
            {filteredOptions.map(option => (
              <motion.button
                key={option.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOptionClick(option.id)}
                disabled={option.comingSoon}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                style={{
                  background: 'var(--cm-surface-alt)',
                  border: '1px solid var(--cm-border-subtle)',
                  opacity: option.comingSoon ? 0.5 : 1,
                }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ 
                    background: 'var(--cm-surface-card)',
                    color: 'var(--cm-icon-primary)',
                  }}
                >
                  {option.icon}
                </div>
                
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p 
                      className="font-medium text-sm"
                      style={{ color: 'var(--cm-text-primary)' }}
                    >
                      {option.label}
                    </p>
                    {option.isPremium && (
                      <span 
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ 
                          background: 'var(--cm-accent-subtle)',
                          color: 'var(--cm-accent)',
                        }}
                      >
                        PRO
                      </span>
                    )}
                    {option.comingSoon && (
                      <span 
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ 
                          background: 'var(--cm-surface-card)',
                          color: 'var(--cm-text-tertiary)',
                          border: '1px solid var(--cm-border-subtle)',
                        }}
                      >
                        Soon
                      </span>
                    )}
                  </div>
                  <p 
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--cm-text-tertiary)' }}
                  >
                    {option.description}
                  </p>
                </div>
                
                {!option.comingSoon && (
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--cm-icon-secondary)' }} />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhanceMomentSheet;
