/**
 * CollegeMasthead — Phase 1 polish (College Franchise brief).
 *
 * Changes:
 *  - Eyebrow "⚡ CLBHOUZ · COLLEGE RANKINGS" retired (title is the anchor).
 *  - Title renamed "College Rankings" → "College Franchise" (identity).
 *    TourHubNavOverlay label intentionally remains "College Franchise Rankings"
 *    (description) — identity vs description split.
 *  - Typography upsized to spec (title 26/800, leader name 30/900, value 26/900).
 *  - Narrative pills row (1–3 pills) below leader value, above stat strip.
 *    Tab-driven copy. Reuses MastheadPill type + PillView from LeadersMasthead.
 *  - Tab-aware sub-line copy ("Most decorated by season earnings", etc.).
 *  - Stat strip preserved (4-cell, active amber-tinted).
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';
import type { AlumniFace } from '../../hooks/useBatchCollegeAlumni';
import type { FranchiseCaptain } from '../../hooks/useFranchiseCaptains';
import { type MastheadPill, PillView } from '../leaders/LeadersMasthead';
import {
  captainDominates,
  captainShortName,
  formatCaptainEarnings,
} from '../../utils/captainAnchor';

type ActiveMetric = 'earnings' | 'wins' | 'top10s' | 'movers';

const METRIC_EYEBROW: Record<ActiveMetric, string> = {
  earnings: '#1 BY EARNINGS',
  wins: '#1 BY WINS',
  top10s: '#1 BY TOP 10s',
  movers: '#1 BY EARNINGS',
};

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
  /** Captain (top-earning alumnus) of the #1 franchise — drives captain pill. */
  captain?: FranchiseCaptain | null;
  /** #2 franchise stats — drives the Margin pill. Null when only one franchise. */
  runnerUp?: CollegeSeasonStats | null;
  /** True when #1 and #2 are tied on the active metric. */
  isTiedAtOne?: boolean;
  /** Movers tab context — drives Movers-tab pills. */
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

/**
 * Compute the per-tab pill set. Pills are omitted (not stubbed) when the
 * underlying data isn't available — tour-honest UI.
 *
 * Per locked decisions #3 + #5: captain pill always uses earnings-anchor
 * copy ("{Captain} · ${X.X}M season") regardless of the active tab.
 * Captain identity is universal; the season-earnings anchor is the
 * franchise's elevator pitch.
 */
function buildPills(args: {
  activeMetric: ActiveMetric;
  stats: CollegeSeasonStats;
  runnerUp: CollegeSeasonStats | null | undefined;
  isTiedAtOne: boolean;
  captain: FranchiseCaptain | null | undefined;
  moversContext: CollegeMastheadProps['moversContext'];
}): MastheadPill[] {
  const { activeMetric, stats, runnerUp, isTiedAtOne, captain, moversContext } = args;
  const pills: MastheadPill[] = [];

  // Movers tab — full custom pill set, no margin/captain pills.
  if (activeMetric === 'movers' && moversContext) {
    if (moversContext.climberCount > 0) {
      pills.push({
        variant: 'highlight',
        value: `${moversContext.climberCount} ${pluralize(moversContext.climberCount, 'climber')} this week`,
      });
    }
    if (moversContext.biggestJump) {
      pills.push({
        variant: 'normal',
        value: `${moversContext.biggestJump.displayName} +${formatCompactUSD(moversContext.biggestJump.earningsDelta).replace('$', '$')} · biggest jump`,
      });
    }
    if (moversContext.biggestRankMove && moversContext.biggestRankMove.rankDelta > 0) {
      pills.push({
        variant: 'normal',
        value: `${moversContext.biggestRankMove.displayName} +${moversContext.biggestRankMove.rankDelta} ranks · biggest move`,
      });
    }
    return pills;
  }

  // Earnings / Wins / Top10s — Margin pill (or Tied), then Captain pill.
  if (activeMetric === 'earnings') {
    if (runnerUp) {
      const gap = stats.earnings_total - runnerUp.earnings_total;
      if (isTiedAtOne) {
        pills.push({ variant: 'highlight', value: `Tied #1 · ${formatCompactUSD(stats.earnings_total)}` });
      } else if (gap > 0) {
        pills.push({ variant: 'highlight', value: `+${formatCompactUSD(gap)} ahead of #2` });
      }
    }
  } else if (activeMetric === 'wins') {
    if (runnerUp) {
      const gap = stats.wins_total - runnerUp.wins_total;
      if (isTiedAtOne) {
        pills.push({ variant: 'highlight', value: `Tied #1 · ${stats.wins_total} ${pluralize(stats.wins_total, 'win')}` });
      } else if (gap > 0) {
        pills.push({ variant: 'highlight', value: `+${gap} ahead of #2` });
      }
    }
  } else if (activeMetric === 'top10s') {
    if (runnerUp) {
      const gap = stats.top10_total - runnerUp.top10_total;
      if (isTiedAtOne) {
        pills.push({ variant: 'highlight', value: `Tied #1 · ${stats.top10_total} top 10s` });
      } else if (gap > 0) {
        pills.push({ variant: 'highlight', value: `+${gap} ahead of #2` });
      }
    }
  }

  // Captain pill — always earnings-anchor copy. Gated by >20% margin rule.
  if (captain && captainDominates(captain)) {
    pills.push({
      variant: 'normal',
      value: `${captainShortName(captain.fullName)} · ${formatCaptainEarnings(captain.earnings)} season`,
    });
  }

  return pills;
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
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const slug = stats.normalized_name;
  const logoUrl = getCollegeLogoUrl(college?.college_name || stats.normalized_name);

  const primaryValue = activeMetric === 'wins'
    ? String(stats.wins_total)
    : activeMetric === 'top10s'
    ? String(stats.top10_total)
    : formatCurrency(stats.earnings_total);

  const subline = isTiedAtOne ? METRIC_SUBLINE_TIED[activeMetric] : METRIC_SUBLINE[activeMetric];

  const pills = buildPills({ activeMetric, stats, runnerUp, isTiedAtOne, captain, moversContext });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${stats.normalized_name}-${activeMetric}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'linear-gradient(180deg, #0B1426 0%, #070D1A 100%)',
          padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 0',
        }}
      >
        {/* Title row */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <h1 style={{
            fontSize: 26, fontWeight: 800, color: '#ffffff',
            letterSpacing: '-0.8px', lineHeight: 1, margin: 0,
          }}>
            College Franchise
          </h1>
          <span style={{
            fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.08em',
          }}>
            Season 2025–26
          </span>
        </div>

        {/* Subline (tab-aware) */}
        <div style={{
          fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.45)',
          marginBottom: 14, letterSpacing: 0,
        }}>
          {subline}
        </div>

        {/* No.1 Cover Story */}
        <Link
          to={`/tourhub/college-golf/${slug}`}
          style={{ textDecoration: 'none', display: 'block' }}
          className="active:opacity-80 transition-opacity"
        >
          <div style={{ position: 'relative', paddingBottom: 14 }}>
            <div style={{ maxWidth: '62%' }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: '#F7931E',
                letterSpacing: '1.4px', marginBottom: 6,
              }}>
                {METRIC_EYEBROW[activeMetric]}
              </div>

              <h2 style={{
                fontSize: 30, fontWeight: 900, color: '#ffffff',
                letterSpacing: '-1px', lineHeight: 1.02, margin: '0 0 6px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
              }}>
                {displayName}
              </h2>

              <div style={{
                fontSize: 26, fontWeight: 900, color: '#F7931E',
                letterSpacing: '-0.5px', marginBottom: 6,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {primaryValue}
              </div>

              <div style={{
                fontSize: 11, fontWeight: 500,
                color: 'rgba(255,255,255,0.40)',
              }}>
                {stats.player_count} alumni on tour
              </div>
            </div>

            {/* College logo — right side */}
            <div style={{
              position: 'absolute', top: '50%', right: 0,
              transform: 'translateY(-50%)',
              width: 110, height: 110,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.5))' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <span style={{ fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.15)' }}>
                  {displayName.charAt(0)}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Narrative pills row */}
        {pills.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap' as const, gap: 6,
            paddingBottom: 12,
          }}>
            {pills.map((p, i) => (
              <PillView key={`${p.label ?? ''}-${p.value}-${i}`} pill={p} />
            ))}
          </div>
        )}

        {/* 4-col stat strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '0.5px solid rgba(255,255,255,0.08)',
        }}>
          {([
            { label: 'EARNINGS', value: formatCurrency(stats.earnings_total), accent: activeMetric === 'earnings' },
            { label: 'WINS', value: String(stats.wins_total), accent: activeMetric === 'wins' },
            { label: 'TOP 10s', value: String(stats.top10_total), accent: activeMetric === 'top10s' },
            { label: 'ALUMNI', value: String(stats.player_count), accent: false },
          ] as const).map((s, i) => (
            <div key={s.label} style={{
              padding: '9px 0 11px', textAlign: 'center',
              borderRight: i < 3 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
              background: s.accent ? 'rgba(247,147,30,0.06)' : 'transparent',
            }}>
              <div style={{
                fontSize: 9.5, fontWeight: 900, color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.12em', marginBottom: 3,
              }}>
                {s.label}
              </div>
              <div style={{
                fontSize: 14, fontWeight: 900,
                color: s.accent ? '#F7931E' : '#ffffff',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
