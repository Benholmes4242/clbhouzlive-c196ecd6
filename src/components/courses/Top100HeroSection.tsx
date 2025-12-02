import React from 'react';
import type { Top100Ring } from '@/lib/top100Club';
import { TOP100_TIER_STYLES } from '@/lib/top100RingStyles';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Squircle } from '@/components/ui/squircle';

// Tier color mapping (hex values for inline styles)
const TIER_COLORS: Record<Top100Ring, string> = {
  none: '#94a3b8',
  rookie: '#D9C7A3',
  fairway: '#8BBF5A',
  founders: '#2E5930',
  heritage: '#C8A44B',
  century: '#B7BCC6',
  elite: '#D9A441',
  legendary: '#5A3E8C',
  grandslam: '#0C0F14',
};

export interface Top100HeroSectionProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  totalPlayed: number;
  regionsCount: number;
  clubRing?: Top100Ring;
  clubLabel?: string | null;
  clubTierName?: string | null;
  lastPlayedDate?: string | null;
  isOwnProfile?: boolean;
}

export function Top100HeroSection({
  avatarUrl,
  displayName,
  totalPlayed,
  regionsCount,
  clubRing = 'none',
  clubLabel,
  clubTierName,
  lastPlayedDate,
  isOwnProfile,
}: Top100HeroSectionProps) {
  const initials = displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const tierColor = TIER_COLORS[clubRing] || TIER_COLORS.none;
  const pageBg = 'hsl(var(--background))';

  // Temporarily hide club pill
  const SHOW_CLUB_PILL = false;

  return (
    <div className="flex flex-col items-center text-center space-y-4 py-4">
      {/* Squircle + thin achievement ring */}
      <div className="flex items-center justify-center">
        <div
          className="inline-flex items-center justify-center rounded-[30px] border-[2px] p-[1px] shadow-[0_0_24px_rgba(15,23,42,0.06)]"
          style={{
            borderColor: tierColor,
            backgroundColor: pageBg,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName ?? 'Golfer avatar'}
              className="h-32 w-24 rounded-[26px] object-cover"
            />
          ) : (
            <div className="h-32 w-24 rounded-[26px] bg-muted flex items-center justify-center text-xl font-semibold text-muted-foreground">
              {initials}
            </div>
          )}
        </div>
      </div>

      {/* Club pill - temporarily hidden */}
      {SHOW_CLUB_PILL && clubTierName && (
        <div className="px-4 py-1.5 bg-[#0A0A0A] rounded-full border border-white/10 flex items-center gap-1.5 shadow-md">
          <Trophy className="w-4 h-4 text-white/80" />
          <span className="text-white text-sm font-medium">{clubTierName}</span>
        </div>
      )}

      {/* Stats */}
      <div className="text-center flex flex-col gap-1.5">
        <p className="text-lg font-semibold text-foreground">
          {isOwnProfile ? "You've" : `${displayName} has`} played {totalPlayed} Top 100 course
          {totalPlayed === 1 ? '' : 's'}
        </p>

        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
          Across {regionsCount} {regionsCount === 1 ? 'region' : 'regions'}
        </p>

        {lastPlayedDate && (
          <p className="text-sm text-muted-foreground">
            Last Top 100 round: {new Date(lastPlayedDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
