/**
 * LeadersRunnersStrip — Opaque card runners matching PlayersHero RunnerCard style.
 * bg-card, border, squircle avatars, rank badges.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';
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

const RANK_COLORS: Record<number, string> = {
  2: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
  3: 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
};

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
  const photoUrl = resolvePhotoUrl(player.photo_url, player.pga_tour_id);
  const lastName = player.full_name.split(' ').slice(-1)[0];
  const country = titleCaseCountry(player.country);
  const fmt = formatOverride ?? category.format;
  const unit = unitOverride ?? category.unit;

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-2xl active:scale-[0.97] transition-transform"
      style={{
        scrollSnapAlign: 'start',
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border) / 0.4)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)',
        minWidth: '140px',
        flex: '1 1 0%',
      }}
    >
      {/* Rank Badge */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: RANK_COLORS[rank] || RANK_COLORS[3], boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)' }}
      >
        <span className="text-xs font-bold text-white">{rank}</span>
      </div>

      {/* Avatar — squircle */}
      <SquircleAvatar
        src={photoUrl}
        alt={player.full_name}
        size="sm"
        hideRing
        className="shrink-0"
      />

      {/* Name & stat */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-foreground truncate">{lastName}</p>
        <p className="text-[10px] text-muted-foreground truncate tabular-nums">
          {fmt(value)}{unit ? ` ${unit}` : ''}
        </p>
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
      className="flex gap-2.5 px-4 sm:px-6"
      style={{ marginTop: '-8px', position: 'relative', zIndex: 10 }}
    >
      {runners.map((runner, index) => (
        <RunnerCard
          key={runner.playerId}
          runner={runner}
          category={category}
          formatOverride={formatOverride}
          unitOverride={unitOverride}
          index={index}
        />
      ))}
    </motion.div>
  );
}
