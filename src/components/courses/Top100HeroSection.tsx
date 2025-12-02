import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Top100Ring } from '@/lib/top100Club';
import { getTop100Club } from '@/lib/top100Club';
import { getTop100RingBorderClass } from '@/lib/top100RingStyles';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Squircle } from '@/components/ui/squircle';

export interface Top100HeroSectionProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  totalPlayed: number;
  regionsCount: number;
  clubRing?: Top100Ring;
  clubLabel?: string | null;
  clubTierName?: string | null;  // NEW: "Trailmaster", "Century Club", etc.
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

  return (
    <div className="flex flex-col items-center text-center space-y-6 py-6">
      {/* Big Ring with Avatar & Halo */}
      <div className="relative h-40 w-40 md:h-44 md:w-44 flex items-center justify-center -mt-6">
        <div
          className={cn(
            'relative border-4 ring-4 ring-offset-4 ring-offset-background shadow-lg shadow-slate-900/20 overflow-hidden',
            getTop100RingBorderClass(clubRing)
          )}
          style={{ borderRadius: '35px' }}
        >
          {/* Soft halo */}
          <div className="absolute inset-[-6px] bg-sky-500/10 blur-md" style={{ borderRadius: '41px' }} />

          <Squircle width={112} height={112}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName ?? 'Player avatar'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-semibold bg-surface-slate text-white">
                {initials}
              </div>
            )}
          </Squircle>
        </div>

        {clubTierName && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 text-slate-50 text-xs px-4 py-1 shadow-md">
            {clubTierName}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 text-center space-y-1">
        <p className="text-base md:text-lg font-semibold text-foreground">
          {isOwnProfile ? "You've" : "They've"} played {totalPlayed} Top 100 course
          {totalPlayed === 1 ? '' : 's'}
        </p>

        <p className="text-sm text-muted-foreground">
          Across {regionsCount} {regionsCount === 1 ? 'region' : 'regions'}
          {clubTierName && (
            <>
              {' · '}🏆 {clubTierName}
            </>
          )}
        </p>

        {lastPlayedDate && (
          <p className="text-xs text-muted-foreground">
            Last Top 100 round: {new Date(lastPlayedDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
