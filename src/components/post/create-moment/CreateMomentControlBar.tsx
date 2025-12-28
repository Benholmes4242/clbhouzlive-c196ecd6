import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Sparkles, Tag, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateMomentControlBarProps {
  hasMedia: boolean;
  hasCategories: boolean;
  hasEnhanced?: boolean;
  visibilityChanged?: boolean;
  onMediaClick: () => void;
  onEnhanceClick: () => void;
  onCategoriesClick: () => void;
  onVisibilityClick: () => void;
  className?: string;
  isFirstTime?: boolean;
}

interface ControlBarButtonProps {
  icon: React.ReactNode;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  'aria-label': string;
  shouldBounce?: boolean;
  onBounceComplete?: () => void;
}

const ControlBarButton: React.FC<ControlBarButtonProps> = ({
  icon,
  isActive = false,
  disabled = false,
  onClick,
  'aria-label': ariaLabel,
  shouldBounce = false,
  onBounceComplete,
}) => {
  const [isBouncing, setIsBouncing] = useState(false);

  // Trigger bounce animation when shouldBounce changes to true
  useEffect(() => {
    if (shouldBounce && !isBouncing) {
      setIsBouncing(true);
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      // Reset after animation
      const timer = setTimeout(() => {
        setIsBouncing(false);
        onBounceComplete?.();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [shouldBounce, isBouncing, onBounceComplete]);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.92 }}
      animate={{ 
        scale: isBouncing ? [1, 1.08, 1] : 1,
      }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
        disabled && "opacity-40 cursor-not-allowed"
      )}
      style={{
        background: isActive ? 'var(--cm-surface-slate)' : 'var(--cm-surface-alt)',
        border: isActive ? 'none' : '1px solid var(--cm-border-subtle)',
      }}
      aria-label={ariaLabel}
    >
      <span style={{ color: isActive ? 'white' : 'var(--cm-icon-primary)' }}>
        {icon}
      </span>
      {/* Active indicator dot */}
      {isActive && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
          style={{ 
            background: 'var(--cm-accent)',
            boxShadow: '0 0 4px rgba(247, 147, 30, 0.5)',
          }}
        />
      )}
    </motion.button>
  );
};

/**
 * CreateMomentControlBar - Persistent bottom control bar
 * 4 icons: Media, Enhance, Categories, Visibility
 * Icons show active state with filled background and indicator dot
 */
export const CreateMomentControlBar: React.FC<CreateMomentControlBarProps> = ({
  hasMedia,
  hasCategories,
  hasEnhanced = false,
  visibilityChanged = false,
  onMediaClick,
  onEnhanceClick,
  onCategoriesClick,
  onVisibilityClick,
  className,
  isFirstTime = false,
}) => {
  // Track which buttons have bounced to avoid repeating
  const [bouncedMedia, setBouncedMedia] = useState(false);
  const [bouncedCategories, setBouncedCategories] = useState(false);
  const [showHint, setShowHint] = useState(isFirstTime);

  // Dismiss hint on first interaction
  const dismissHint = useCallback(() => {
    setShowHint(false);
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 px-4 py-2",
        className
      )}
      style={{
        background: 'var(--cm-surface-card)',
        borderTop: '1px solid var(--cm-border-subtle)',
      }}
    >
      {/* First-time hint */}
      <AnimatePresence>
        {showHint && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[11px] font-medium"
            style={{ color: 'var(--cm-text-tertiary)' }}
          >
            Tag • Enhance • Visibility
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-3">
        {/* Media picker */}
        <ControlBarButton
          icon={<Image className="w-5 h-5" />}
          isActive={hasMedia}
          onClick={() => {
            dismissHint();
            onMediaClick();
          }}
          aria-label="Add media"
          shouldBounce={hasMedia && !bouncedMedia}
          onBounceComplete={() => setBouncedMedia(true)}
        />

        {/* Enhance */}
        <ControlBarButton
          icon={<Sparkles className="w-5 h-5" />}
          isActive={hasEnhanced}
          disabled={!hasMedia}
          onClick={() => {
            dismissHint();
            onEnhanceClick();
          }}
          aria-label="Enhance your moment"
        />

        {/* Categories */}
        <ControlBarButton
          icon={<Tag className="w-5 h-5" />}
          isActive={hasCategories}
          onClick={() => {
            dismissHint();
            onCategoriesClick();
          }}
          aria-label="Select categories"
          shouldBounce={hasCategories && !bouncedCategories}
          onBounceComplete={() => setBouncedCategories(true)}
        />

        {/* Visibility */}
        <ControlBarButton
          icon={<Eye className="w-5 h-5" />}
          isActive={visibilityChanged}
          onClick={() => {
            dismissHint();
            onVisibilityClick();
          }}
          aria-label="Set visibility"
        />
      </div>
    </div>
  );
};

export default CreateMomentControlBar;