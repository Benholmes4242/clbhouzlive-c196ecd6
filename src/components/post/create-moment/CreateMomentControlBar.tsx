import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Sparkles, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/ui/haptics';

interface CreateMomentControlBarProps {
  hasMedia: boolean;
  hasCategories: boolean;
  hasEnhanced?: boolean;
  onMediaClick: () => void;
  onEnhanceClick: () => void;
  onCategoriesClick: () => void;
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
}

const ControlBarButton: React.FC<ControlBarButtonProps> = ({
  icon,
  isActive = false,
  disabled = false,
  onClick,
  'aria-label': ariaLabel,
  shouldBounce = false,
}) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.98 }}
      animate={{ 
        scale: shouldBounce ? [1, 1.04, 1] : 1,
      }}
      transition={{ 
        duration: 0.15,
        scale: { duration: 0.2 }
      }}
      onAnimationComplete={() => {
        if (shouldBounce) {
          triggerHaptic('selection');
        }
      }}
      className={cn(
        "relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150",
        disabled && "opacity-40 cursor-not-allowed"
      )}
      style={{
        background: isActive ? 'var(--cm-surface-slate)' : '#e2e8f0',
        border: 'none',
        boxShadow: isActive ? '0 2px 6px rgba(0, 0, 0, 0.1)' : 'none',
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
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
          style={{ 
            background: 'var(--cm-surface-slate)',
            border: '2px solid var(--cm-surface-card)',
          }}
        />
      )}
    </motion.button>
  );
};

/**
 * CreateMomentControlBar - Persistent bottom control bar
 * 3 icons: Media, Enhance, Categories
 * Icons show active state with filled background and indicator dot
 */
export const CreateMomentControlBar: React.FC<CreateMomentControlBarProps> = ({
  hasMedia,
  hasCategories,
  hasEnhanced = false,
  onMediaClick,
  onEnhanceClick,
  onCategoriesClick,
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

  // Compute bounce flags
  const shouldBounceMedia = hasMedia && !bouncedMedia;
  const shouldBounceCategories = hasCategories && !bouncedCategories;

  // Mark as bounced after animation (moved to useEffect to avoid render-time setState)
  useEffect(() => {
    if (!hasMedia || bouncedMedia) return;
    const t = setTimeout(() => setBouncedMedia(true), 300);
    return () => clearTimeout(t);
  }, [hasMedia, bouncedMedia]);

  useEffect(() => {
    if (!hasCategories || bouncedCategories) return;
    const t = setTimeout(() => setBouncedCategories(true), 300);
    return () => clearTimeout(t);
  }, [hasCategories, bouncedCategories]);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 py-2",
        className
      )}
      style={{
        background: 'transparent',
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
            Tag • Enhance
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-4">
        {/* Media picker */}
        <ControlBarButton
          icon={<Image className="w-[18px] h-[18px]" />}
          isActive={hasMedia}
          onClick={() => {
            dismissHint();
            onMediaClick();
          }}
          aria-label="Add media"
          shouldBounce={shouldBounceMedia}
        />

        {/* Enhance */}
        <ControlBarButton
          icon={<Sparkles className="w-[18px] h-[18px]" />}
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
          icon={<Tag className="w-[18px] h-[18px]" />}
          isActive={hasCategories}
          onClick={() => {
            dismissHint();
            onCategoriesClick();
          }}
          aria-label="Select categories"
          shouldBounce={shouldBounceCategories}
        />
      </div>
    </div>
  );
};

export default CreateMomentControlBar;
