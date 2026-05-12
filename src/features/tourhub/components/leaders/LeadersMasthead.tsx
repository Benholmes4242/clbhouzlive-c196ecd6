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

  const bg = isAmberToned ? 'rgba(247,147,30,0.12)' : 'rgba(255,255,255,0.06)';
  const border = isLive
    ? 'rgba(247,147,30,0.55)'
    : isHighlight
      ? 'rgba(247,147,30,0.30)'
      : 'rgba(255,255,255,0.10)';
  const valueColor = isAmberToned ? '#F7931E' : '#ffffff';
  const labelColor = isAmberToned ? 'rgba(247,147,30,0.75)' : 'rgba(255,255,255,0.45)';
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

/**
 * Splits a formatted stat value into integer + decimal-tail parts.
 * The decimal tail renders in amber per Stat Watch exemplar (IMG_6047).
 */
function splitStatValue(formatted: string): { integer: string; decimal: string; suffix: string } {
  const match = formatted.match(/^([^\d-]*-?\d+)(\.\d+)?(.*)$/);
  if (!match) return { integer: formatted, decimal: '', suffix: '' };
  return { integer: match[1], decimal: match[2] ?? '', suffix: match[3] ?? '' };
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
          background: '#F8FAFC',
          padding: 'calc(16px + max(env(safe-area-inset-top, 0px), 47px)) 16px 14px',
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
            <Activity size={13} strokeWidth={2.5} style={{ color: '#F7931E' }} />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: '#F7931E',
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
                style={{ color: '#F7931E', marginTop: 1 }}
              />
            )}
          </button>

          <h1
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.015em',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {category.label}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 8,
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>
              {year} Season · {tourLabel}
            </span>
            {showTourAvg && (
              <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>
                Tour avg{' '}
                <span
                  style={{
                    color: '#0F172A',
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
              background: 'linear-gradient(135deg, rgba(255,184,0,0.10) 0%, rgba(255,184,0,0.04) 100%)',
              border: '1px solid rgba(255,184,0,0.32)',
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
              <Crown size={13} strokeWidth={2.5} fill="#FFB800" style={{ color: '#FFB800' }} />
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                SEASON LEADER
              </span>
              {streakLabel && (
                <>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#94A3B8' }}>·</span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: '#64748B',
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
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#94A3B8' }}>·</span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: '#64748B',
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
                    background: '#EDF1F5',
                    border: '2.5px solid #FFB800',
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
                    background: '#FFB800',
                    border: '2.5px solid #ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 900,
                    color: '#0F172A',
                  }}
                >
                  1
                </div>
              </div>

              {/* Info: name + country left, big stat right */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: '#0F172A',
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
                    }}
                  >
                    <CountryFlag country={leader.player.country_code || leader.player.country} size="sm" />
                    {countryName && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>
                        {countryName}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: '#0F172A',
                      letterSpacing: '-0.025em',
                      lineHeight: 1.1,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {integer}
                    {decimal && <span style={{ color: '#F7931E' }}>{decimal}</span>}
                    {suffix && <span style={{ color: '#0F172A' }}>{suffix}</span>}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: '#64748B',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      marginTop: 4,
                    }}
                  >
                    {category.label}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
