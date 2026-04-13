/**
 * LeaderRow — Flat dispatch row for Performance Rankings.
 * Large faded rank number, 34px squircle avatar, proportion bar.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderCategory } from './constants';

interface LeaderRowProps {
  rank: number;
  overrideRank?: number;
  player: {
    id: string;
    fullName: string;
    country?: string | null;
    countryCode?: string | null;
    photoUrl?: string | null;
    pgaTourId?: string | null;
    tourCodes?: string[] | null;
  };
  value: number;
  leaderValue: number;
  category: LeaderCategory;
  formatOverride?: (v: number) => string;
  unitOverride?: string;
  index: number;
}

export function LeaderRow({
  rank,
  overrideRank,
  player,
  value,
  leaderValue,
  category,
  formatOverride,
  unitOverride,
  index,
}: LeaderRowProps) {
  const displayRank = overrideRank ?? rank;
  const photoUrl = getPlayerHeadshotUrl(player.fullName, player.tourCodes?.[0] ?? 'pga');
  const fmt = formatOverride ?? category.format;
  const unit = unitOverride ?? category.unit;
  const formattedStat = fmt(value);

  const ariaLabel = `Rank ${displayRank}, ${player.fullName}, ${formattedStat}${unit ? ` ${unit}` : ''}`;

  const isFirst = displayRank === 1;
  const barPct = leaderValue > 0 ? Math.min(100, (value / leaderValue) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.25 }}
    >
      <Link
        to={`/tourhub/player/${player.id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          borderBottom: '0.5px solid rgba(15,23,42,0.07)',
          borderLeft: isFirst ? '3px solid #F7931E' : '3px solid transparent',
          background: isFirst ? 'rgba(247,147,30,0.025)' : 'transparent',
          textDecoration: 'none',
        }}
        className="active:bg-black/[0.02] transition-colors"
        aria-label={ariaLabel}
      >
        {/* Large faded rank number */}
        <div style={{ width: '44px', padding: '13px 0 13px 14px', flexShrink: 0 }}>
          <span style={{
            fontSize: '18px', fontWeight: 900,
            color: isFirst ? 'rgba(247,147,30,0.25)' : 'rgba(15,23,42,0.1)',
            lineHeight: 1, letterSpacing: '-0.03em', display: 'block',
          }}>
            {displayRank}
          </span>
        </div>

        {/* Avatar — 34px squircle */}
        <div style={{ width: '34px', height: '34px', borderRadius: '34%', overflow: 'hidden', flexShrink: 0, background: 'rgba(15,23,42,0.06)', marginRight: '10px' }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={player.fullName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 8%' }}
              loading="lazy"
              onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.08)' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8' }}>
                {player.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </span>
            </div>
          )}
        </div>

        {/* Player info */}
        <div style={{ flex: 1, minWidth: 0, padding: '12px 0' }}>
          <div style={{
            fontSize: '14px', fontWeight: isFirst ? 800 : 600, color: '#0F172A',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
          }}>
            {player.fullName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <CountryFlag country={player.countryCode || player.country} size="sm" />
            {player.country && (
              <span style={{ fontSize: '10px', color: '#94A3B8' }}>{player.country}</span>
            )}
          </div>
        </div>

        {/* Stat value + proportion bar */}
        <div style={{ padding: '12px 14px 12px 0', textAlign: 'right' as const, flexShrink: 0, minWidth: '72px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: isFirst ? '#F7931E' : '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {formattedStat}
          </span>
          {unit && (
            <span style={{ fontSize: '9px', fontWeight: 500, color: '#94A3B8', marginLeft: '2px' }}>
              {unit}
            </span>
          )}
          {/* Proportion bar — value relative to leader */}
          <div style={{ marginTop: '4px', width: '60px', height: '3px', borderRadius: '2px', background: 'rgba(15,23,42,0.06)', overflow: 'hidden', marginLeft: 'auto' }}>
            <div style={{ height: '100%', width: `${barPct}%`, background: isFirst ? '#F7931E' : 'rgba(15,23,42,0.2)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
