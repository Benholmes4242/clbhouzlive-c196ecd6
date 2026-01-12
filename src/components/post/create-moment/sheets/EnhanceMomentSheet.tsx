import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Wand2, Type, Film, ChevronRight, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    id: 'ai-caption',
    label: 'AI Caption',
    description: 'Generate a caption with AI',
    icon: <Type className="w-5 h-5" />,
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
  onOpenAiCaption?: () => void;
  onOpenSmartCompilation?: () => void;
  videoCount?: number;
}

/**
 * EnhanceMomentSheet - Premium glass bottom sheet for optional enhancements
 * Studio-grade tool hub with glass card rows
 */
export const EnhanceMomentSheet: React.FC<EnhanceMomentSheetProps> = ({
  isOpen,
  onClose,
  onOpenStudio,
  onOpenBadges,
  onOpenAiCaption,
  onOpenSmartCompilation,
  videoCount = 0,
}) => {
  const filteredOptions = useMemo(() => {
    return ENHANCE_OPTIONS.filter(option => {
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
    } else if (optionId === 'ai-caption' && onOpenAiCaption) {
      onClose();
      onOpenAiCaption();
    } else if (optionId === 'smart-compilation' && onOpenSmartCompilation) {
      onClose();
      onOpenSmartCompilation();
    }
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
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.15))',
                }}
              >
                <Sparkles className="w-5 h-5" style={{ color: '#a855f7' }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--cm-text-primary)' }}>
                  Enhance your moment
                </h3>
                <p className="text-xs" style={{ color: 'var(--cm-text-tertiary)' }}>
                  Studio tools to perfect your post
                </p>
              </div>
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
            {filteredOptions.map(option => (
              <motion.button
                key={option.id}
                whileTap={{ scale: option.comingSoon ? 1 : 0.98 }}
                onClick={() => handleOptionClick(option.id)}
                disabled={option.comingSoon}
                className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all"
                style={{
                  background: 'var(--cm-surface-alt)',
                  border: '1px solid var(--cm-border-subtle)',
                  opacity: option.comingSoon ? 0.5 : 1,
                }}
              >
                <div 
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: 'var(--cm-surface-card)',
                    border: '1px solid var(--cm-border-subtle)',
                  }}
                >
                  <div style={{ color: 'var(--cm-icon-primary)' }}>
                    {option.icon}
                  </div>
                </div>
                
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm" style={{ color: 'var(--cm-text-primary)' }}>
                      {option.label}
                    </p>
                    {option.isPremium && (
                      <span 
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ 
                          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(59, 130, 246, 0.2))',
                          color: '#a855f7',
                        }}
                      >
                        PRO
                      </span>
                    )}
                    {option.comingSoon && (
                      <span 
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
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
                  <p className="text-xs mt-0.5" style={{ color: 'var(--cm-text-tertiary)' }}>
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
