/**
 * MediaPlayerTopBar — self-contained top bar for the media player.
 * [Tab Toggle] [Search] [Profile Pill]
 * No Clubhouse-specific imports. Uses auth hooks directly.
 */
import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedTabToggle } from './FeedTabToggle';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';
import { splitName } from '@/utils/name';
import type { FeedTab } from './types/media';

interface MediaPlayerTopBarProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

/** Inline squircle avatar – 24px, 34% radius, 1/1.05 aspect */
function MiniSquircleAvatar({ src, name }: { src?: string | null; name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <div
      className="flex-shrink-0 overflow-hidden bg-white/20 flex items-center justify-center"
      style={{
        width: 24,
        height: 24 * 1.05,
        borderRadius: '34%',
        aspectRatio: '1 / 1.05',
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          style={{ borderRadius: '34%' }}
        />
      ) : (
        <span className="text-[10px] font-semibold text-white/90 select-none">{initials}</span>
      )}
    </div>
  );
}

export function MediaPlayerTopBar({ activeTab, onTabChange }: MediaPlayerTopBarProps) {
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);

  const displayName = profile?.display_name || '';
  const { first } = splitName(displayName);
  const avatarUrl = profile?.profile_photo_url;

  return (
    <div
      className="fixed left-4 right-4 z-40 pointer-events-auto flex items-center justify-between gap-2 min-w-0"
      style={{
        top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)',
      }}
    >
      {/* Left: Tab Toggle */}
      <div className="flex-shrink-1 min-w-0">
        <FeedTabToggle activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      {/* Right: Search + Profile Pill */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Search – bare icon in transparent tap target */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'p-0 flex items-center justify-center rounded-full active:scale-[0.97] transition-all',
            'h-11 w-11 flex-shrink-0',
            'bg-transparent hover:bg-transparent border-0 shadow-none',
            'text-white/70'
          )}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Profile Pill – glass capsule */}
        {user && (
          <button
            className={cn(
              'h-11 max-w-[160px] rounded-xl pl-1 pr-2',
              'flex items-center gap-1.5 min-w-0',
              'active:scale-[0.97] transition-transform',
              'border border-white/10'
            )}
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            }}
          >
            <MiniSquircleAvatar src={avatarUrl} name={displayName || 'User'} />
            <span className="text-sm font-medium text-white truncate max-w-[100px]">
              {first || 'User'}
            </span>
            <ChevronDown className="h-3 w-3 text-white/70 flex-shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}
