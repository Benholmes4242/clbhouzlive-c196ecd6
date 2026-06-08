/**
 * LeadersMasthead — Canonical light editorial header for Stat Watch.
 * Mirrors Schedule + Players mastheads (§2/§9 of CLBHOUZ design system).
 * Stat Watch-specific: amber decimal-tail on the leader's big stat value.
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ChevronRight, Crown, Flame, Trophy } from 'lucide-react';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';
import { playerRoute } from '../../routes';
import type { LeaderCategory } from './constants';
import { splitStatValue } from '../../utils/splitStatValue';

import {
  AMBER,
  GLASS_BLUR,
  GOLD,
  GOLD_DEEP,
  GOLD_BORDER,
  GOLD_TINT,
  GOLD_TINT_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  SLATE_50,
  SLATE_150,
  SURFACE,
} from '../../_shared/tokens';

// ─────────────────────────────────────────────────────────────────────────────
// MastheadPill / PillView — kept for cross-surface compatibility.
// Used by TournamentHero, PlayerHero, CollegeMasthead, CollegeProfilePage.
// LeadersMasthead itself no longer renders pills (folded into caption row).
// ─────────────────────────────────────────────────────────────────────────────
export interface MastheadPill {
  variant: 'highlight' | 'normal' | 'live';
  label?: string;
  value: string;
  icon?: 'flame' | 'trophy';
  prefix?: React.ReactNode;
}

export function PillView({ pill }: { pill: MastheadPill }) {
  const isHighlight = pill.variant === 'highlight';
  const isLive = pill.variant === 'live';
  const isAmberToned = isHighlight || isLive;

  // Liquid-glass base: dark translucent fallback under the backdrop blur
  // so the pill stays legible if backdrop-filter is unsupported.
  const bg = isAmberToned ? 'rgba(15,23,42,0.30)' : 'rgba(15,23,42,0.28)';
  const border = isLive
    ? 'rgba(247,147,30,0.65)'
    : isHighlight
      ? 'rgba(247,147,30,0.45)'
      : 'rgba(255,255,255,0.22)';
  const valueColor = isAmberToned ? '#F7931E' : '#ffffff';
  const labelColor = isAmberToned ? 'rgba(247,147,30,0.85)' : 'rgba(255,255,255,0.55)';
  const Icon = pill.icon === 'flame' ? Flame : pill.icon === 'trophy' ? Trophy : null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '5px 9px',
        borderRadius: 9,
        background: bg,
        border: `0.5px solid ${border}`,
        backdropFilter: GLASS_BLUR,
        WebkitBackdropFilter: GLASS_BLUR,
        boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.30), 0 2px 8px rgba(0,0,0,0.18)',
        fontSize: 11,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums',
        textShadow: '0 1px 2px rgba(0,0,0,0.35)',
      }}
    >
      {pill.prefix
        ? pill.prefix
        : Icon && <Icon size={11} strokeWidth={2.5} style={{ color: valueColor }} />}
      {pill.label && (
        <span style={{ fontSize: 10, fontWeight: 600, color: labelColor }}>{pill.label}</span>
      )}
      <span style={{ fontWeight: 800, color: valueColor }}>{pill.value}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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
  /** Optional caption metadata e.g. "11 CONSECUTIVE WEEKS". */
  streakLabel?: string | null;
  /** Optional caption metadata e.g. "MARGIN +243 PTS". */
  marginLabel?: string | null;
  /** Season year — composes the subhead context line. */
  seasonYear?: number | null;
  /** Tour identifier for subhead — defaults to PGA. */
  tourLabel?: string;
  /** Tap on eyebrow → navigate back to Tour Overview. */
  onEyebrowTap?: () => void;
}




export function LeadersMasthead({
  leader,
  category,
  formatOverride,
  unitOverride,
  streakLabel,
  marginLabel,
  seasonYear,
  tourLabel = 'PGA',
  onEyebrowTap,
}: LeadersMastheadProps) {
  if (!leader) return null;

  const fmt = formatOverride ?? category.format;
  const unit = unitOverride ?? category.unit;
  const formattedValue = `${fmt(leader.value)}${unit ? ` ${unit}` : ''}`;
  const { integer, decimal, suffix } = splitStatValue(formattedValue);
  const countryName = titleCaseCountry(leader.player.country);
  const photoUrl = getPlayerHeadshotUrl(
    leader.player.full_name,
    leader.player.tour_codes?.[0] ?? 'pga'
  );
  const year = seasonYear ?? new Date().getFullYear();
  const showTourAvg = !!category.tourAverage && category.tourAverage !== '—';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${category.key}-${leader.playerId}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: SLATE_50,
          padding: '16px 16px 14px',
        }}
      >
        {/* ── Section header (canonical §2) ── */}
        <div style={{ marginBottom: 14 }}>
          <button
            type="button"
            onClick={onEyebrowTap}
            disabled={!onEyebrowTap}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              padding: 0,
              marginBottom: 6,
              cursor: onEyebrowTap ? 'pointer' : 'default',
            }}
          >
            <Activity size={13} strokeWidth={2.5} style={{ color: AMBER }} />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: AMBER,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              STAT WATCH
            </span>
            {onEyebrowTap && (
              <ChevronRight
                size={11}
                strokeWidth={2.5}
                style={{ color: AMBER, marginTop: 1 }}
              />
            )}
          </button>


          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 8,
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: INK, letterSpacing: '-0.005em' }}>
              {year} Season · {tourLabel}
            </span>
            {showTourAvg && (
              <span style={{ fontSize: 13, fontWeight: 600, color: INK_FAINT }}>
                Tour avg{' '}
                <span
                  style={{
                    color: INK,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {category.tourAverage}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* ── Leader champion card ── */}
        <Link
          {...playerRoute(leader.player.id, { kind: 'stat-watch' })}
          style={{ textDecoration: 'none', display: 'block' }}
          className="active:opacity-90 transition-opacity"
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${GOLD_TINT_10} 0%, ${GOLD_TINT} 100%)`,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: 14,
              padding: 14,
            }}
          >
            {/* Caption row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 10,
                flexWrap: 'wrap',
              }}
            >
              <Crown size={13} strokeWidth={2.5} fill={GOLD} style={{ color: GOLD_DEEP, flexShrink: 0 }} />
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                SEASON LEADER
              </span>
              {streakLabel && (
                <>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: INK_MUTE }}>·</span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: INK_MUTE,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {streakLabel}
                  </span>
                </>
              )}
              {marginLabel && (
                <>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: INK_MUTE }}>·</span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: INK_MUTE,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {marginLabel}
                  </span>
                </>
              )}
            </div>

            {/* Body row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Photo + "1" badge */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '34%',
                    overflow: 'hidden',
                    background: SLATE_150,
                    border: `2.5px solid ${GOLD}`,
                  }}
                >
                  <img
                    src={photoUrl}
                    alt={leader.player.full_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 5%' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL;
                    }}
                  />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: GOLD,
                    border: `2.5px solid ${SURFACE}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 900,
                    color: INK,
                  }}
                >
                  1
                </div>
              </div>

              {/* Info: name, country, then stat stacked underneath */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: INK,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {leader.player.full_name}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginTop: 4,
                    minWidth: 0,
                  }}
                >
                  <CountryFlag country={leader.player.country_code || leader.player.country} size="sm" />
                  {countryName && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: INK_MUTE,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {countryName}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: INK,
                      letterSpacing: '-0.025em',
                      lineHeight: 1.1,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {integer}
                    {decimal && <span style={{ color: AMBER }}>{decimal}</span>}
                    {suffix && <span style={{ color: INK }}>{suffix}</span>}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: INK_MUTE,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {category.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
