import React from 'react';
import type { Top100Ring } from '@/lib/top100Club';
import SquircleImage from '@/components/ui/SquircleImage';
import { Trophy } from 'lucide-react';

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
  const avatarSize = 160;

  return (
    <div className="flex flex-col items-center text-center space-y-4 py-4">
      {/* Ring + avatar */}
      <div className="relative">
        {avatarUrl ? (
          <SquircleImage
            size={avatarSize}
            src={avatarUrl}
            alt={displayName ?? 'Golfer avatar'}
            ringColor={tierColor}
            ringWidth={5}
          />
        ) : (
          <div
            className="flex items-center justify-center bg-slate-200"
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: '30%',
              border: `5px solid ${tierColor}`,
            }}
          >
            <span className="text-3xl font-semibold text-slate-700">
              {initials}
            </span>
          </div>
        )}

        {/* Club pill – dark background, white text, overlaid at bottom */}
        {clubTierName && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-4 px-4 py-2 rounded-lg bg-slate-800/90 backdrop-blur-sm text-white text-sm font-medium whitespace-nowrap text-center leading-tight">
            {clubTierName.split(' ').map((word, i) => (
              <React.Fragment key={i}>
                {word}
                {i === 0 && <br />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="text-center flex flex-col gap-1">
        <p className="text-lg font-semibold text-foreground">
          {isOwnProfile ? "You've" : `${displayName} has`} played {totalPlayed} Top 100 course
          {totalPlayed === 1 ? '' : 's'}
        </p>

        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
          Across {regionsCount} {regionsCount === 1 ? 'region' : 'regions'}
          {clubTierName && (
            <>
              <span>·</span>
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>{clubTierName}</span>
            </>
          )}
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
