/**
 * ProfileFloatingHeader — transparent floating control row over a full-bleed
 * profile hero. Mirrors the ClubhouseTopBar pattern: bare white glyphs, no
 * frosted circles, no bar background. A subtle top scrim handles legibility.
 *
 * Layout (Option C):
 *   LEFT  : back arrow (or settings gear when nothing to pop)
 *   RIGHT : search · more (⋯)
 *
 * Anchored at top:0 with paddingTop = safe-area-inset-top so glyphs land
 * exactly where ClubhouseTopBar / CompactHeader sit — directly under the notch.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, MoreHorizontal, Settings, type LucideIcon } from 'lucide-react';
import GlobalSearchOverlay from '@/components/search/GlobalSearchOverlay';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { safeGoBack } from '@/utils/navigation';

const FLOAT_STROKE = 2;
const GLYPH_COLOR = '#FFFFFF';

export type FloatingMenuItem =
  | { kind: 'separator' }
  | {
      kind?: 'item';
      icon: LucideIcon;
      label: string;
      onClick: () => void;
      destructive?: boolean;
    };

export interface ProfileFloatingHeaderProps {
  /** When true, left glyph is a settings gear (own-profile reached via tab). */
  isSelf?: boolean;
  /** Fallback path for safeGoBack when there's no history to pop. */
  backFallback?: string;
  /** Items rendered inside the ⋯ dropdown. */
  menuItems: FloatingMenuItem[];
  /** Optional override for the settings tap target (defaults to /settings). */
  onSettingsClick?: () => void;
}

export const ProfileFloatingHeader: React.FC<ProfileFloatingHeaderProps> = ({
  isSelf = false,
  backFallback = '/clubhouse',
  menuItems,
  onSettingsClick,
}) => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  // When viewing own profile via the bottom-nav tab there's no history to pop —
  // show a settings gear instead. Otherwise show a back arrow.
  const showSettingsAsLeft = isSelf && (typeof window === 'undefined' || window.history.length <= 1);

  const handleLeft = () => {
    if (showSettingsAsLeft) {
      if (onSettingsClick) onSettingsClick();
      else navigate('/settings');
    } else {
      safeGoBack(navigate, backFallback);
    }
  };

  return (
    <>
      {/* Top scrim — legibility only, never blocks taps */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 pointer-events-none z-[39]"
        style={{
          height: 'calc(env(safe-area-inset-top, 0px) + 96px)',
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* Floating control row — anchored directly under the notch */}
      <div
        className="absolute left-0 right-0 z-40 pointer-events-none"
        style={{
          top: 0,
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div
          className="flex items-center justify-between pointer-events-auto"
          style={{ height: 44, padding: '0 12px' }}
        >
          {/* LEFT */}
          <button
            type="button"
            onClick={handleLeft}
            aria-label={showSettingsAsLeft ? 'Settings' : 'Back'}
            className="flex items-center justify-center active:scale-95 transition-transform"
            style={{
              width: 44,
              height: 44,
              background: 'transparent',
              border: 'none',
              padding: 0,
              color: GLYPH_COLOR,
              cursor: 'pointer',
            }}
          >
            {showSettingsAsLeft ? (
              <Settings size={24} strokeWidth={FLOAT_STROKE} />
            ) : (
              <ArrowLeft size={24} strokeWidth={FLOAT_STROKE} />
            )}
          </button>

          {/* RIGHT cluster */}
          <div className="flex items-center" style={{ gap: 8 }}>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="flex items-center justify-center active:scale-95 transition-transform"
              style={{
                width: 44,
                height: 44,
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: GLYPH_COLOR,
                cursor: 'pointer',
              }}
            >
              <Search size={21} strokeWidth={FLOAT_STROKE} />
            </button>

            <DropdownMenu
              onOpenChange={(open) => {
                if (!open) (document.activeElement as HTMLElement)?.blur();
              }}
            >
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="More options"
                  className="flex items-center justify-center active:scale-95 transition-transform focus:outline-none"
                  style={{
                    width: 44,
                    height: 44,
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    color: GLYPH_COLOR,
                    cursor: 'pointer',
                  }}
                >
                  <MoreHorizontal size={21} strokeWidth={FLOAT_STROKE} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {menuItems.map((item, i) => {
                  if (item.kind === 'separator') {
                    return <DropdownMenuSeparator key={`sep-${i}`} />;
                  }
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={`${item.label}-${i}`}
                      onClick={item.onClick}
                      className={item.destructive ? 'text-destructive focus:text-destructive' : ''}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <GlobalSearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default ProfileFloatingHeader;
