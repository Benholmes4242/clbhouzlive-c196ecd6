/**
 * CollegeMasthead — Canonical light editorial header for College Franchise.
 * Mirrors Schedule + Players + Leaders mastheads (§2/§9 of CLBHOUZ design system).
 *
 * h1 stays static here (page identity); tab-specific copy lives in the subhead.
 * Inverts Stat Watch (LeadersMasthead.tsx), where h1 is the active category name.
 * Rationale: Stat Watch users navigate between categories, College Franchise
 * users explore the same dataset through different sorts.
 */

import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ChevronRight, Crown } from 'lucide-react';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';
import type { AlumniFace } from '../../hooks/useBatchCollegeAlumni';
import type { FranchiseCaptain } from '../../hooks/useFranchiseCaptains';
import { splitStatValue } from '../../utils/splitStatValue';
import {
  captainDominates,
  captainShortName,
  formatCaptainEarnings,
} from '../../utils/captainAnchor';

type ActiveMetric = 'earnings' | 'wins' | 'top10s' | 'movers';

const METRIC_SUBLINE: Record<ActiveMetric, string> = {
  earnings: 'Most decorated by season earnings',
  wins: 'Most wins this season',
  top10s: 'Most consistent across the field',
  movers: 'Biggest weekly mover',
};

const METRIC_SUBLINE_TIED: Record<ActiveMetric, string> = {
  earnings: 'Tied for season earnings lead',
  wins: 'Tied for most wins this season',
  top10s: 'Tied for most top 10s this season',
  movers: 'Biggest weekly mover',
};

interface CollegeMastheadProps {
  stats: CollegeSeasonStats;
  college: CollegeMedia | null;
  activeMetric: ActiveMetric;
  heroAlumni: AlumniFace[] | null;
  captain?: FranchiseCaptain | null;
  runnerUp?: CollegeSeasonStats | null;
  isTiedAtOne?: boolean;
  moversContext?: {
    climberCount: number;
    biggestJump: { displayName: string; earningsDelta: number } | null;
    biggestRankMove: { displayName: string; rankDelta: number } | null;
  } | null;
}

function formatCompactUSD(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function pluralize(n: number, singular: string, plural?: string): string {
  return Math.abs(n) === 1 ? singular : (plural || singular + 's');
}

export function CollegeMasthead({
  stats,
  college,
  activeMetric,
  heroAlumni: _heroAlumni,
  captain,
  runnerUp,
  isTiedAtOne = false,
  moversContext,
}: CollegeMastheadProps) {
  const navigate = useNavigate();
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const slug = stats.normalized_name;
  const logoUrl = getCollegeLogoUrl(college?.college_name || stats.normalized_name);

  const subline = isTiedAtOne ? METRIC_SUBLINE_TIED[activeMetric] : METRIC_SUBLINE[activeMetric];

  // Caption metadata composition (Q3 decision — see brief).
  // Priority order: MARGIN / TIED → CAPTAIN → ALUMNI fallback.
  // Cap at 3 items max (SEASON LEADER + 2 metadata).
  const captionMetadata: string[] = (() => {
    if (activeMetric === 'movers' && moversContext) {
      const moverItems: string[] = [];
      if (moversContext.climberCount > 0) {
        moverItems.push(`${moversContext.climberCount} ${pluralize(moversContext.climberCount, 'CLIMBER').toUpperCase()} THIS WEEK`);
      }
      if (moversContext.biggestJump) {
        moverItems.push(`${moversContext.biggestJump.displayName.toUpperCase()} +${formatCompactUSD(moversContext.biggestJump.earningsDelta).toUpperCase()}`);
      }
      return moverItems.slice(0, 2);
    }

    const items: string[] = [];

    if (runnerUp) {
      const getValue = (s: CollegeSeasonStats) => {
        switch (activeMetric) {
          case 'wins': return s.wins_total;
          case 'top10s': return s.top10_total;
          default: return s.earnings_total;
        }
      };
      const gap = getValue(stats) - getValue(runnerUp);
      if (isTiedAtOne) {
        items.push(activeMetric === 'earnings'
          ? `TIED #1 · ${formatCompactUSD(stats.earnings_total).toUpperCase()}`
          : activeMetric === 'wins'
          ? `TIED #1 · ${stats.wins_total} WINS`
          : `TIED #1 · ${stats.top10_total} TOP 10S`);
      } else if (gap > 0) {
        if (activeMetric === 'earnings') {
          items.push(`+${formatCompactUSD(gap).toUpperCase()} AHEAD OF #2`);
        } else {
          items.push(`+${gap} AHEAD OF #2`);
        }
      }
    }

    if (captain && captainDominates(captain)) {
      items.push(`${captainShortName(captain.fullName).toUpperCase()} · ${formatCaptainEarnings(captain.earnings).toUpperCase()} SEASON`);
    } else {
      items.push(`${stats.player_count} ALUMNI`);
    }

    return items.slice(0, 2);
  })();

  // Primary value split (Stat Watch decimal-tail pattern).
  const primaryValueText = activeMetric === 'wins'
    ? String(stats.wins_total)
    : activeMetric === 'top10s'
    ? String(stats.top10_total)
    : formatCurrency(stats.earnings_total);
  const { integer: primaryInteger, decimal: primaryDecimal, suffix: primarySuffix } = splitStatValue(primaryValueText);
  const primaryLabel = activeMetric === 'wins'
    ? 'WINS'
    : activeMetric === 'top10s'
    ? 'TOP 10s'
    : 'EARNINGS';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${stats.normalized_name}-${activeMetric}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: '#F8FAFC',
          padding: 'calc(16px + max(env(safe-area-inset-top, 0px), 47px)) 16px 14px',
        }}
      >
        {/* Section header (canonical §2) */}
        <div style={{ marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => navigate('/tourhub?tab=overview', { replace: true })}
            aria-label="College Franchise — open Tour Overview"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 6,
            }}
          >
            <GraduationCap size={13} strokeWidth={2.5} style={{ color: '#F7931E' }} />
            <span style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: '#F7931E',
              textTransform: 'uppercase' as const,
            }}>
              COLLEGE FRANCHISE
            </span>
            <ChevronRight size={11} strokeWidth={2.5} style={{ color: '#F7931E', marginTop: 1 }} />
          </button>
          <h1 style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.015em',
            lineHeight: 1.2,
            margin: 0,
          }}>
            College Franchise
          </h1>
          <div style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#64748B',
            letterSpacing: '-0.005em',
            lineHeight: 1.25,
            margin: '6px 0 0',
          }}>
            Season 2025–26 · {subline}
          </div>
        </div>

        {/* Franchise champion card */}
        <Link
          to={`/tourhub/college-golf/${slug}`}
          style={{ textDecoration: 'none', display: 'block' }}
          className="active:opacity-90 transition-opacity"
        >
          <div style={{
            background: 'linear-gradient(180deg, rgba(255,184,0,0.10) 0%, rgba(255,184,0,0.04) 100%)',
            border: '1px solid rgba(255,184,0,0.32)',
            borderRadius: 14,
            padding: 14,
          }}>
            {/* Caption row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 12,
              flexWrap: 'wrap' as const,
            }}>
              <Crown size={13} strokeWidth={2.5} fill="#FFB800" style={{ color: '#D97706', flexShrink: 0 }} />
              <span style={{
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: '#0F172A',
                textTransform: 'uppercase' as const,
              }}>
                SEASON LEADER
              </span>
              {captionMetadata.map((part, i) => (
                <Fragment key={`${part}-${i}`}>
                  <span style={{ color: '#94A3B8', fontSize: 10.5, fontWeight: 800 }}>·</span>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    color: '#64748B',
                    textTransform: 'uppercase' as const,
                  }}>
                    {part}
                  </span>
                </Fragment>
              ))}
            </div>

            {/* Body row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '34%',
                  overflow: 'hidden',
                  background: '#FFFFFF',
                  border: '2.5px solid #FFB800',
                  boxShadow: '0 4px 12px rgba(255,184,0,0.20)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 10,
                }}>
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={displayName}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span style={{ fontSize: 28, fontWeight: 900, color: 'rgba(15,23,42,0.20)' }}>
                      {displayName.charAt(0)}
                    </span>
                  )}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#FFB800',
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 900,
                  border: '2.5px solid #ffffff',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.15)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  1
                </div>
              </div>

              <div style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#0F172A',
                    letterSpacing: '-0.025em',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap' as const,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {displayName}
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' as const }}>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#0F172A',
                    letterSpacing: '-0.025em',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {primaryInteger}
                    {primaryDecimal && <span style={{ color: '#F7931E' }}>{primaryDecimal}</span>}
                    {primarySuffix && <span style={{ color: '#0F172A' }}>{primarySuffix}</span>}
                  </div>
                  <div style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.16em',
                    color: '#64748B',
                    textTransform: 'uppercase' as const,
                    marginTop: 4,
                  }}>
                    {primaryLabel}
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
