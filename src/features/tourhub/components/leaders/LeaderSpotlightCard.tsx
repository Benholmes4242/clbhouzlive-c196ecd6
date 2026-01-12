/**
 * LeaderSpotlightCard - Premium podium display for top 3 leaders
 * Feels like opening a pack - cinematic and addictive
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';
import { CollegeCrestTile } from '../college';

interface SpotlightPlayer {
  rank: 1 | 2 | 3;
  name: string;
  country: string;
  countryCode?: string;
  avatarUrl?: string | null;
  statValue: string | number;
  statLabel?: string;
  collegeName?: string | null;
  collegeLogoUrl?: string | null;
}

interface LeaderSpotlightCardProps {
  players: SpotlightPlayer[];
  title?: string;
  statLabel: string;
  className?: string;
}

const ChampionCard: React.FC<SpotlightPlayer & { statLabel?: string }> = ({
  name,
  country,
  avatarUrl,
  statValue,
  statLabel,
  collegeName,
  collegeLogoUrl,
}) => {
  return (
    <div className="relative flex-1 min-w-0">
      {/* Champion glow background */}
      <div className="absolute inset-0 rounded-sq-lg bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.18),transparent_60%)] pointer-events-none" />
      
      <div className="relative p-5 animate-fade-in">
        {/* Crown chip */}
        <div className="inline-flex items-center gap-1.5 rounded-sq-pill bg-brand-orange/10 px-3 py-1 mb-4">
          <Crown className="w-3.5 h-3.5 text-brand-orange" />
          <span className="text-xs font-semibold text-brand-orange">Champion</span>
        </div>

        <div className="flex items-start gap-4">
          {/* Avatar with glow */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-brand-orange/20 blur-lg scale-110" />
            <div className="relative w-16 h-16 rounded-full bg-muted overflow-hidden ring-2 ring-brand-orange/30">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-muted-foreground">
                  {name.charAt(0)}
                </div>
              )}
            </div>
            {/* Rank medal */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-orange flex items-center justify-center shadow-lg ring-2 ring-white">
              <span className="text-xs font-bold text-white">1</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base text-foreground truncate">{name}</p>
            <p className="text-sm text-muted-foreground">{country}</p>
            
            {/* College badge */}
            {collegeName && (
              <div className="flex items-center gap-1.5 mt-2">
                {collegeLogoUrl && (
                  <CollegeCrestTile
                    logoUrl={collegeLogoUrl}
                    collegeName={collegeName}
                    size="compact"
                  />
                )}
                <span className="text-xs text-muted-foreground">{collegeName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Headline stat */}
        <div className="mt-4 pt-4 border-t border-border/20">
          <p className="text-[36px] font-semibold tracking-tight text-foreground leading-none">
            {typeof statValue === 'number' ? statValue.toLocaleString() : statValue}
          </p>
          {statLabel && (
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{statLabel}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const RunnerUpCard: React.FC<SpotlightPlayer> = ({
  rank,
  name,
  country,
  avatarUrl,
  statValue,
}) => {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-sq-md",
      "bg-slate-50/50 dark:bg-white/5",
      "transition-all duration-motion-fast",
      "active:scale-[0.99]"
    )}>
      {/* Rank badge */}
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold",
        rank === 2 && "bg-slate-200 text-slate-600",
        rank === 3 && "bg-orange-100 text-orange-700"
      )}>
        {rank}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground">
            {name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{country}</p>
      </div>

      {/* Stat */}
      <p className="text-sm font-semibold text-foreground tabular-nums">
        {typeof statValue === 'number' ? statValue.toLocaleString() : statValue}
      </p>
    </div>
  );
};

export const LeaderSpotlightCard: React.FC<LeaderSpotlightCardProps> = ({
  players,
  title = 'Leaderboard Spotlight',
  statLabel,
  className,
}) => {
  const champion = players.find(p => p.rank === 1);
  const runnersUp = players.filter(p => p.rank !== 1).sort((a, b) => a.rank - b.rank);

  return (
    <div className={cn(
      "rounded-sq-lg overflow-hidden",
      "bg-white dark:bg-white/5",
      "shadow-[0_12px_40px_rgba(15,23,42,0.08)]",
      "ring-1 ring-slate-200/60 dark:ring-white/10",
      className
    )}>
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{statLabel}</p>
      </div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row">
        {/* Champion */}
        {champion && <ChampionCard {...champion} statLabel={statLabel} />}

        {/* Runners up */}
        <div className="lg:w-64 p-4 space-y-2 border-t lg:border-t-0 lg:border-l border-border/20">
          {runnersUp.map((player) => (
            <RunnerUpCard key={player.rank} {...player} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderSpotlightCard;
