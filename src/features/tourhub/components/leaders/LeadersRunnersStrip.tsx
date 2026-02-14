/**
 * LeadersRunnersStrip — Glass ribbon for #2 and #3 overlapping the hero.
 * Uses backdrop-blur glass effect with avatar + stat value.
 */

import { Link } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { countryCodeToFlag } from '../../utils/countryFlags';
import type { LeaderCategory } from './constants';

interface RunnerItem {
  player: {
    id: string;
    full_name: string;
    country: string | null;
    country_code: string | null;
    photo_url: string | null;
    pga_tour_id: string | null;
  };
  playerId: string;
  value: number;
  rank: number;
}

interface LeadersRunnersStripProps {
  runners: RunnerItem[];
  category: LeaderCategory;
  formatOverride?: (v: number) => string;
  unitOverride?: string;
}

const RANK_STYLES: Record<number, string> = {
  2: 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-700',
  3: 'bg-gradient-to-br from-amber-500/80 to-amber-700/80 text-amber-100',
};

function RunnerPill({
  runner,
  category,
  formatOverride,
  unitOverride,
}: {
  runner: RunnerItem;
  category: LeaderCategory;
  formatOverride?: (v: number) => string;
  unitOverride?: string;
}) {
  const { player, value, rank } = runner;
  const photoUrl = resolvePhotoUrl(player.photo_url, player.pga_tour_id);
  const flag = countryCodeToFlag(player.country_code);
  const fmt = formatOverride ?? category.format;
  const unit = unitOverride ?? category.unit;

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className="flex-1 active:scale-[0.96] transition-transform"
    >
      <div
        className="rounded-xl border border-white/10 px-3 py-2.5 flex items-center gap-2.5"
        style={{
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Rank badge */}
        <div
          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${RANK_STYLES[rank] || RANK_STYLES[3]}`}
        >
          <span className="text-[10px] font-bold">{rank}</span>
        </div>

        <SquircleAvatar
          src={photoUrl}
          alt={player.full_name}
          size="sm"
          hideRing
          className="shrink-0"
        />

        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-white truncate">
            {flag} {player.full_name}
          </p>
          <div className="flex items-baseline gap-0.5 mt-0.5">
            <span className="font-mono text-[13px] font-bold text-white tabular-nums">
              {fmt(value)}
            </span>
            {unit && (
              <span className="text-[9px] text-white/50 uppercase tracking-wider">{unit}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function LeadersRunnersStrip({
  runners,
  category,
  formatOverride,
  unitOverride,
}: LeadersRunnersStripProps) {
  if (runners.length === 0) return null;

  return (
    <div className="flex gap-2 px-4 sm:px-6 -mt-4 relative z-10">
      {runners.map((runner) => (
        <RunnerPill
          key={runner.playerId}
          runner={runner}
          category={category}
          formatOverride={formatOverride}
          unitOverride={unitOverride}
        />
      ))}
    </div>
  );
}
