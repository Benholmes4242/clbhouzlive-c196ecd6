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

  // Generate superellipse path for the ring (same formula as Squircle)
  const generateSuperellipsePath = (w: number, h: number, n = 5, steps = 160): string => {
    const a = w / 2;
    const b = h / 2;
    const m = 2 / n;
    const pts: [number, number][] = [];
    
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const ct = Math.cos(t);
      const st = Math.sin(t);
      const x = Math.sign(ct) * a * Math.pow(Math.abs(ct), m);
      const y = Math.sign(st) * b * Math.pow(Math.abs(st), m);
      pts.push([x + a, y + b]);
    }
    
    return `M ${pts.map(p => p.join(",")).join(" L ")} Z`;
  };

  // Avatar: 144px, Gap: 4px, Ring stroke: 4px (centered)
  // Ring path center: 144 + 4*2 + 4 = 156 (path at center of stroke)
  // Container: 144 + 4*2 (gap) + 4*2 (ring) = 160
  const containerSize = 160;
  const ringPathSize = 156; // Center of 4px stroke, 4px outside avatar edge
  const ringPath = generateSuperellipsePath(ringPathSize, ringPathSize, 5, 160);

  return (
    <div className="flex flex-col items-center text-center space-y-4 py-4">
      {/* Big Ring with Avatar */}
      <div className="relative flex items-center justify-center" style={{ width: containerSize, height: containerSize }}>
        {/* SVG superellipse ring */}
        <svg
          width={containerSize}
          height={containerSize}
          viewBox={`0 0 ${ringPathSize} ${ringPathSize}`}
          className="absolute inset-0"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d={ringPath}
            fill="none"
            stroke={tierColor}
            strokeWidth={4}
          />
        </svg>
        
        {/* Avatar centered */}
        <Squircle width={144} height={144}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName ?? 'Player avatar'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-semibold bg-muted text-foreground">
              {initials}
            </div>
          )}
        </Squircle>

        {/* Tier badge - positioned at bottom of ring */}
        {clubTierName && (
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#0A0A0A] rounded-full border border-white/10 flex items-center gap-1.5 shadow-md">
            <Trophy className="w-4 h-4 text-white/80" />
            <span className="text-white text-sm font-medium">{clubTierName}</span>
          </div>
        )}
      </div>

      {/* Stats - tighter spacing (mt-6 = 14px visual gap from ring bottom + badge) */}
      <div className="text-center mt-6 flex flex-col gap-1.5">
        <p className="text-lg font-semibold text-foreground">
          {isOwnProfile ? "You've" : `${displayName} has`} played {totalPlayed} Top 100 course
          {totalPlayed === 1 ? '' : 's'}
        </p>

        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
          Across {regionsCount} {regionsCount === 1 ? 'region' : 'regions'}
          {clubTierName && (
            <>
              <Trophy className="w-4 h-4 text-primary-accent" />
              {clubTierName}
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
