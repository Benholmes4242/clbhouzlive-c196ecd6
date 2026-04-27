/**
 * LeadersMasthead — Dispatch editorial header for Stat Watch.
 * Slate background, category name as headline, No.1 cover story,
 * narrative pills row (Margin / Streak / Recent Form / vs Avg).
 *
 * The 2-3 runners strip was removed in the Stat Watch polish (Phase 1) —
 * hero owns rank #1, list starts at #2.
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderCategory } from './constants';

export interface MastheadPill {
  /** Render variant — 'highlight' (amber) for dominance moments, 'normal' (slate) for context. */
  variant: 'highlight' | 'normal';
  /** Optional small label rendered before the value (e.g. "Margin:"). */
  label?: string;
  /** Main pill value (e.g. "+1.7 yds", "tied with #2", "5-week leader"). */
  value: string;
  /** Optional leading icon component. */
  icon?: 'flame' | 'trophy';
}

interface LeadersMastheadProps {
  leader: {
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
  } | null;
  category: LeaderCategory;
  formatOverride?: (v: number) => string;
  unitOverride?: string;
  leaderValue?: string;
  /** Narrative pills computed by parent — Margin / Streak / Recent Form / vs Avg. */
  pills?: MastheadPill[];
}

export function PillView({ pill }: { pill: MastheadPill }) {
  const isHighlight = pill.variant === 'highlight';
  const bg = isHighlight ? 'rgba(247,147,30,0.12)' : 'rgba(255,255,255,0.06)';
  const border = isHighlight ? 'rgba(247,147,30,0.30)' : 'rgba(255,255,255,0.10)';
  const valueColor = isHighlight ? '#F7931E' : '#ffffff';
  const labelColor = isHighlight ? 'rgba(247,147,30,0.75)' : 'rgba(255,255,255,0.45)';
  const Icon = pill.icon === 'flame' ? Flame : pill.icon === 'trophy' ? Trophy : null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '5px 9px',
        borderRadius: 6,
        background: bg,
        border: `1px solid ${border}`,
        fontSize: 11,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {Icon && <Icon size={11} strokeWidth={2.5} style={{ color: valueColor }} />}
      {pill.label && (
        <span style={{ fontSize: 10, fontWeight: 600, color: labelColor }}>{pill.label}</span>
      )}
      <span style={{ fontWeight: 800, color: valueColor }}>{pill.value}</span>
    </span>
  );
}

export function LeadersMasthead({
  leader,
  category,
  formatOverride,
  unitOverride,
  leaderValue,
  pills,
}: LeadersMastheadProps) {
  if (!leader) return null;

  const fmt = formatOverride ?? category.format;
  const unit = unitOverride ?? category.unit;
  const formattedValue = `${fmt(leader.value)}${unit ? ` ${unit}` : ''}`;
  const countryName = titleCaseCountry(leader.player.country);
  const photoUrl = getPlayerHeadshotUrl(
    leader.player.full_name,
    leader.player.tour_codes?.[0] ?? 'pga'
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${category.key}-${leader.playerId}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ background: '#0F172A', padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 14px' }}
      >
        {/* Amber eyebrow */}
        <div style={{ fontSize: '15px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: '10px' }}>
          ⚡ CLBHOUZ · STAT WATCH
        </div>

        {/* Masthead double-rule band */}
        <div style={{ borderTop: '2px solid rgba(255,255,255,0.15)', borderBottom: '0.5px solid rgba(255,255,255,0.08)', padding: '10px 0', marginBottom: '14px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>
              {category.label}
            </h1>
          </div>

          {/* Stat context inline — tour avg + leader value */}
          {(category.tourAverage || leaderValue) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              {category.tourAverage && category.tourAverage !== '—' && (
                <>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Tour avg</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>
                    {category.tourAverage}
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)' }}>·</span>
                </>
              )}
              {leaderValue && (
                <>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Leader</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#F7931E', fontVariantNumeric: 'tabular-nums' }}>
                    {leaderValue}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* No.1 Cover Story */}
        <Link
          to={`/tourhub/player/${leader.player.id}`}
          style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', textDecoration: 'none', marginBottom: 0 }}
          className="active:opacity-80 transition-opacity"
        >
          {/* Left — faded rank + identity + value */}
          <div style={{ flex: 1, minWidth: 0, paddingBottom: '4px' }}>
            {/* Large ghost rank number */}
            <div style={{ fontSize: '72px', fontWeight: 900, color: 'rgba(247,147,30,0.12)', lineHeight: 0.85, letterSpacing: '-0.05em', marginBottom: '2px' }}>
              1
            </div>
            {/* SEASON LEADER eyebrow + country */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.12em' }}>SEASON LEADER</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                  <CountryFlag country={leader.player.country_code || leader.player.country} size="sm" />
                  {countryName && (
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{countryName}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Player name */}
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '8px' }}>
              {leader.player.full_name}
            </div>

            {/* Stat value in amber */}
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#F7931E', letterSpacing: '-0.02em' }}>
              {formattedValue}
            </span>
          </div>

          {/* Right — contained headshot, bottom-anchored */}
          <div style={{ flexShrink: 0, width: '100px', alignSelf: 'flex-end' }}>
            <div style={{ width: '100px', height: '120px', borderRadius: '12px 12px 0 0', overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
              <img
                src={photoUrl}
                alt={leader.player.full_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 5%' }}
                onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
              />
            </div>
          </div>
        </Link>

        {/* Narrative pills row — Margin / Streak / Recent Form / vs Avg */}
        {pills && pills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {pills.map((p, i) => (
              <PillView key={`${p.label ?? ''}-${p.value}-${i}`} pill={p} />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
