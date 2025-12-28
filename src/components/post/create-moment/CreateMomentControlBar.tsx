import React from 'react';
import { motion } from 'framer-motion';
import { Image, Sparkles, Tag, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateMomentControlBarProps {
  hasMedia: boolean;
  hasCategories: boolean;
  onMediaClick: () => void;
  onEnhanceClick: () => void;
  onCategoriesClick: () => void;
  onVisibilityClick: () => void;
  className?: string;
}

interface ControlBarButtonProps {
  icon: React.ReactNode;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  'aria-label': string;
}

const ControlBarButton: React.FC<ControlBarButtonProps> = ({
  icon,
  isActive = false,
  disabled = false,
  onClick,
  'aria-label': ariaLabel,
}) => (
  <motion.button
    type="button"
    onClick={onClick}
    disabled={disabled}
    whileTap={{ scale: 0.92 }}
    className={cn(
      "w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
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
  </motion.button>
);

/**
 * CreateMomentControlBar - Persistent bottom control bar
 * 4 icons: Media, Enhance, Categories, Visibility
 * Icons are neutral until used, active icons show subtle state
 */
export const CreateMomentControlBar: React.FC<CreateMomentControlBarProps> = ({
  hasMedia,
  hasCategories,
  onMediaClick,
  onEnhanceClick,
  onCategoriesClick,
  onVisibilityClick,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 px-4 py-2",
        className
      )}
      style={{
        background: 'var(--cm-surface-card)',
        borderTop: '1px solid var(--cm-border-subtle)',
      }}
    >
      {/* Media picker */}
      <ControlBarButton
        icon={<Image className="w-5 h-5" />}
        isActive={hasMedia}
        onClick={onMediaClick}
        aria-label="Add media"
      />

      {/* Enhance */}
      <ControlBarButton
        icon={<Sparkles className="w-5 h-5" />}
        disabled={!hasMedia}
        onClick={onEnhanceClick}
        aria-label="Enhance your moment"
      />

      {/* Categories */}
      <ControlBarButton
        icon={<Tag className="w-5 h-5" />}
        isActive={hasCategories}
        onClick={onCategoriesClick}
        aria-label="Select categories"
      />

      {/* Visibility */}
      <ControlBarButton
        icon={<Eye className="w-5 h-5" />}
        onClick={onVisibilityClick}
        aria-label="Set visibility"
      />
    </div>
  );
};

export default CreateMomentControlBar;
