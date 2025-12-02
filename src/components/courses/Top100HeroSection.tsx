import React from 'react';
import type { Top100Ring } from '@/lib/top100Club';
import SquircleImage from '@/components/ui/SquircleImage';

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
  const avatarSize = 84;

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
            ringWidth={4}
          />
        ) : (
          <svg
            width={avatarSize}
            height={avatarSize}
            viewBox={`0 0 ${avatarSize} ${avatarSize}`}
            style={{ display: 'block' }}
            aria-label={displayName ?? 'Golfer avatar'}
            role="img"
          >
            <defs>
              <clipPath id="squircle-fallback" clipPathUnits="userSpaceOnUse">
                <path d={superellipsePath(avatarSize, avatarSize, 5, 220)} />
              </clipPath>
            </defs>
            <path
              d={superellipsePath(avatarSize, avatarSize, 5, 220)}
              fill="none"
              stroke={tierColor}
              strokeWidth={4}
            />
            <rect
              width={avatarSize}
              height={avatarSize}
              fill="#e2e8f0"
              clipPath="url(#squircle-fallback)"
            />
            <text
              x="50%"
              y="50%"
              dominantBaseline="central"
              textAnchor="middle"
              fontSize="20"
              fontWeight="600"
              fill="#475569"
            >
              {initials}
            </text>
          </svg>
        )}

        {/* Club pill – text only, tier colored */}
        {clubTierName && (
          <div
            className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 bottom-0 px-4 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap"
            style={{
              backgroundColor: `${tierColor}12`,
              borderColor: tierColor,
              color: tierColor,
            }}
          >
            {clubTierName}
          </div>
        )}
      </div>

      {/* Stats - tighter spacing */}
      <div className="text-center mt-6 flex flex-col gap-1.5">
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

// Helper for squircle path (used for fallback initials)
function superellipsePath(w: number, h: number, n = 5, steps = 200) {
  const a = w / 2, b = h / 2, m = 2 / n;
  const pts: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const ct = Math.cos(t), st = Math.sin(t);
    const x = Math.sign(ct) * a * Math.pow(Math.abs(ct), m) + a;
    const y = Math.sign(st) * b * Math.pow(Math.abs(st), m) + b;
    pts.push(`${x},${y}`);
  }
  return `M ${pts.join(' L ')} Z`;
}
