import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRingLabel, getRingColorClass, Top100PrestigeRing } from '@/lib/top100Prestige';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Top100HeroSectionProps {
  avatarUrl?: string | null;
  displayName?: string;
  totalPlayed: number;
  regionsCount: number;
  prestigeRing?: Top100PrestigeRing | null;
  prestigeLabel?: string | null;
  lastPlayedDate?: string | null;
  isOwnProfile: boolean;
}

export function Top100HeroSection({
  avatarUrl,
  displayName,
  totalPlayed,
  regionsCount,
  prestigeRing,
  prestigeLabel,
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
      {/* Big Prestige Ring with Avatar */}
      <div className="relative">
        <div
          className={cn(
            'h-32 w-32 rounded-full flex items-center justify-center border-4 ring-4 ring-offset-4 ring-offset-background transition-all',
            getRingColorClass(prestigeRing)
          )}
        >
          <Avatar className="h-28 w-28">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-2xl bg-surface-slate text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        {prestigeRing && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background px-3 py-1 rounded-full border border-border shadow-sm">
            <span className="text-xs font-medium text-muted-foreground">
              {getRingLabel(prestigeRing)}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="space-y-1">
        <p className="text-lg font-semibold text-foreground">
          {isOwnProfile ? "You've" : "They've"} played{' '}
          <span className="text-primary-accent">{totalPlayed}</span> Top 100 course
          {totalPlayed === 1 ? '' : 's'}
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>
            Across {regionsCount} {regionsCount === 1 ? 'region' : 'regions'}
          </span>
          {prestigeLabel && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-primary-accent">
                <Trophy className="h-3.5 w-3.5" />
                {prestigeLabel}
              </span>
            </>
          )}
        </div>
        {lastPlayedDate && (
          <p className="text-xs text-muted-foreground">
            Last Top 100 round: {new Date(lastPlayedDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
