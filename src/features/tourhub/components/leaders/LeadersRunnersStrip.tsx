/**
 * LeadersRunnersStrip — Runner-up cards matching Players page style.
 * bg-card, rounded-2xl, 32×32 amber rank circles, 36×36 avatars.
 * Overlaps hero bottom by ~20px.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderCategory } from './constants';

interface RunnerItem {
  player: {
    id: string;
    full_name: string;
    country: string | null;
    country_code: string | null;
    photo_url: string | null;
    pga_tour_id: string | null;
    tour_codes?: string[] | null;
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

function RunnerCard({
  runner,
  category,
  formatOverride,
  unitOverride,
  index,
}: {
  runner: RunnerItem;
  category: LeaderCategory;
  formatOverride?: (v: number) => string;
  unitOverride?: string;
  index: number;
}) {
  const { player, value, rank } = runner;
  const photoUrl = getPlayerHeadshotUrl(player.full_name, player.tour_codes?.[0] ?? 'pga');
  const lastName = player.full_name.split(' ').slice(-1)[0];
  const fmt = formatOverride ?? category.format;
  const unit = unitOverride ?? category.unit;

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className="flex items-center gap-2 active:scale-[0.97] transition-transform flex-1 min-w-0 bg-card border border-border/50 rounded-2xl px-3.5 py-2.5"
    >
      {/* Rank number — plain, muted */}
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: 'hsl(var(--muted-foreground))',
          flexShrink: 0,
          width: 18,
          textAlign: 'center',
        }}
      >
        {index + 2}
      </span>

      {/* Avatar — 36×36, 34% border-radius */}
      <div
        className="flex-shrink-0 overflow-hidden"
        style={{ width: 36, height: 36, borderRadius: '34%', border: '1px solid rgba(255,255,255,0.18)' }}
      >
        {photoUrl ? (
          <img src={photoUrl} alt={player.full_name} style={{ width: 36, height: 36, objectFit: 'cover' }} />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xs font-semibold">
              {player.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
        )}
      </div>

      {/* Name & flag */}
      <div className="flex-1 min-w-0 text-left">
        <p style={{ fontSize: 14, fontWeight: 600 }} className="text-foreground truncate">{lastName}</p>
        <div className="flex items-center gap-1">
          <CountryFlag country={runner.player.country_code || runner.player.country} size="sm" />
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.35 }}
      className="flex"
      style={{ padding: '0 16px', marginTop: '-20px', position: 'relative', zIndex: 10, gap: 8, boxSizing: 'border-box', width: '100%' }}
    >
      {runners.map((runner, i) => (
        <RunnerCard
          key={runner.playerId}
          runner={runner}
          category={category}
          formatOverride={formatOverride}
          unitOverride={unitOverride}
          index={i}
        />
      ))}
    </motion.div>
  );
}
