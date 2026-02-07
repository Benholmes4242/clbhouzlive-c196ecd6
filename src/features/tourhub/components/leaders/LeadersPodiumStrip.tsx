/**
 * LeadersPodiumStrip — Compact horizontal strip showing Top 3 players.
 * #1 is wider (horizontal layout), #2/#3 are narrower (vertical layout).
 * Replaces LeadersHeroCard for the top 3 positions.
 */

import { Link } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';
import type { LeaderCategory } from './constants';

export interface PodiumPlayer {
  id: string;
  fullName: string;
  country?: string | null;
  countryCode?: string | null;
  photoUrl?: string | null;
  pgaTourId?: string | null;
}

export interface PodiumEntry {
  player: PodiumPlayer;
  value: number;
  rank: number;
  overrideRank?: number;
}

interface LeadersPodiumStripProps {
  entries: PodiumEntry[];
  category: LeaderCategory;
  formatOverride?: (v: number) => string;
  unitOverride?: string;
}

/* ─── Rank badge gradients ─── */
const RANK_STYLES: Record<number, string> = {
  1: 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900',
  2: 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-700',
  3: 'bg-gradient-to-br from-amber-500/80 to-amber-700/80 text-amber-100',
};

const ACCENT_BORDER: Record<number, string> = {
  1: 'border-l-4 border-l-amber-400',
  2: 'border-l-4 border-l-border/80',
  3: 'border-l-4 border-l-amber-600/60',
};

function PodiumCard({
  entry,
  position,
  category,
  formatOverride,
  unitOverride,
}: {
  entry: PodiumEntry;
  position: number;
  category: LeaderCategory;
  formatOverride?: (v: number) => string;
  unitOverride?: string;
}) {
  const { player, value } = entry;
  const displayRank = entry.overrideRank ?? entry.rank;
  const photoUrl = resolvePhotoUrl(player.photoUrl, player.pgaTourId);
  const flag = countryCodeToFlag(player.countryCode);
  const countryName = titleCaseCountry(player.country);
  const fmt = formatOverride ?? category.format;
  const unit = unitOverride ?? category.unit;

  if (position === 1) {
    // ─── #1: wider horizontal layout ───
    return (
      <Link
        to={`/tourhub/player/${player.id}`}
        className="flex-[1.6] active:scale-[0.97] transition-transform"
      >
        <div
          className={`bg-card border border-border rounded-xl overflow-hidden relative h-full ${ACCENT_BORDER[1]}`}
        >
          {/* Rank badge */}
          <div
            className={`absolute -top-0 -left-0 w-7 h-7 rounded-br-lg flex items-center justify-center ${RANK_STYLES[1]} z-10`}
          >
            <span className="text-xs font-bold">{displayRank}</span>
          </div>

          <div className="flex items-center gap-3 p-3 pl-4">
            <SquircleAvatar
              src={photoUrl}
              alt={player.fullName}
              size="lg"
              hideRing
              className="ring-2 ring-amber-400/30 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground text-sm truncate">
                {player.fullName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {flag} {countryName}
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono font-bold text-foreground text-base">
                  {fmt(value)}
                </span>
                {unit && (
                  <span className="text-[10px] text-muted-foreground">
                    {unit}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // ─── #2 / #3: narrower vertical layout ───
  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className="flex-1 active:scale-[0.97] transition-transform"
    >
      <div
        className={`bg-card border border-border rounded-xl overflow-hidden relative h-full ${ACCENT_BORDER[position] || ''}`}
      >
        {/* Rank badge */}
        <div
          className={`absolute -top-0 -left-0 w-7 h-7 rounded-br-lg flex items-center justify-center ${RANK_STYLES[position] || RANK_STYLES[3]} z-10`}
        >
          <span className="text-xs font-bold">{displayRank}</span>
        </div>

        <div className="flex flex-col items-center text-center p-3 pt-4">
          <SquircleAvatar
            src={photoUrl}
            alt={player.fullName}
            size="md"
            hideRing
            className="shrink-0"
          />
          <p className="font-semibold text-foreground text-xs truncate w-full mt-2">
            {player.fullName}
          </p>
          <p className="text-[10px] text-muted-foreground truncate w-full">
            {flag} {countryName}
          </p>
          <div className="flex items-baseline gap-0.5 mt-1">
            <span className="font-mono font-bold text-foreground text-sm">
              {fmt(value)}
            </span>
            {unit && (
              <span className="text-[10px] text-muted-foreground">{unit}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function LeadersPodiumStrip({
  entries,
  category,
  formatOverride,
  unitOverride,
}: LeadersPodiumStripProps) {
  if (entries.length === 0) return null;

  return (
    <div className="flex gap-3">
      {entries.slice(0, 3).map((entry, idx) => (
        <PodiumCard
          key={entry.player.id}
          entry={entry}
          position={idx + 1}
          category={category}
          formatOverride={formatOverride}
          unitOverride={unitOverride}
        />
      ))}
    </div>
  );
}
