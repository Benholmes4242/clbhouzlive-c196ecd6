/**
 * StickyMiniHeader - Compact header that appears after hero scrolls away
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Settings, Share2, ArrowLeft } from 'lucide-react';

interface StickyMiniHeaderProps {
  visible: boolean;
  avatarUrl?: string;
  displayName: string;
  isOwnProfile?: boolean;
  onBack?: () => void;
  onSettings?: () => void;
  onShare?: () => void;
  className?: string;
}

export const StickyMiniHeader: React.FC<StickyMiniHeaderProps> = ({
  visible,
  avatarUrl,
  displayName,
  isOwnProfile = true,
  onBack,
  onSettings,
  onShare,
  className,
}) => {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        visible 
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-full opacity-0 pointer-events-none',
        className
      )}
      style={{
        background: 'var(--dgp-glass-surface)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--dgp-glass-stroke)',
      }}
    >
      <div className="flex items-center justify-between px-4 h-14 safe-top">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          {!isOwnProfile && onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'var(--dgp-glass-surface)' }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: 'var(--dgp-text-primary)' }} />
            </button>
          )}

          <div className="flex items-center gap-2">
            <SquircleAvatar
              src={avatarUrl}
              fallback={displayName.substring(0, 2)}
              size="sm"
            />
            <span
              className="font-semibold text-sm"
              style={{ color: 'var(--dgp-text-primary)' }}
            >
              {displayName}
            </span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {onShare && (
            <button
              onClick={onShare}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'var(--dgp-glass-surface)' }}
            >
              <Share2 className="w-4 h-4" style={{ color: 'var(--dgp-text-primary)' }} />
            </button>
          )}

          {isOwnProfile && onSettings && (
            <button
              onClick={onSettings}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'var(--dgp-glass-surface)' }}
            >
              <Settings className="w-4 h-4" style={{ color: 'var(--dgp-text-primary)' }} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default StickyMiniHeader;
