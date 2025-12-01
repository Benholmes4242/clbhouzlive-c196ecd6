import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Top100Ring } from '@/lib/top100Club';
import { getTop100Club } from '@/lib/top100Club';
import { getTop100RingBorderClass } from '@/lib/top100RingStyles';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col items-center text-center space-y-4 py-6">
      {/* Big Ring with Avatar */}
      <div className="relative">
        <div
          className={cn(
            'h-32 w-32 rounded-full flex items-center justify-center border-4 ring-4 ring-offset-4 ring-offset-background transition-all',
            getTop100RingBorderClass(clubRing)
          )}
        >
          <Avatar className="h-28 w-28">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-2xl bg-surface-slate text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        {clubTierName && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/90 px-3 py-1 text-[11px] font-medium text-slate-50">
            {clubTierName}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {isOwnProfile ? "You've" : "They've"} played {totalPlayed} Top 100 course
          {totalPlayed === 1 ? '' : 's'}
        </p>
        <p className="text-xs text-muted-foreground">
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
