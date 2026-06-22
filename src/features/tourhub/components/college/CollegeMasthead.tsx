/**
 * CollegeMasthead — Canonical light editorial header for College Franchise.
 * Mirrors Schedule + Players + Leaders mastheads (§2/§9 of CLBHOUZ design system).
 *
 * h1 stays static here (page identity); tab-specific copy lives in the subhead.
 * Inverts Stat Watch (LeadersMasthead.tsx), where h1 is the active category name.
 * Rationale: Stat Watch users navigate between categories, College Franchise
 * users explore the same dataset through different sorts.
 */


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
  AMBER,
  GOLD,
  GOLD_BORDER,
  GOLD_DEEP,
  GOLD_TINT,
  GOLD_TINT_10,
  INK,
  INK_MUTE,
  SLATE_50,
  SURFACE,
} from '../../_shared/tokens';

type ActiveMetric = 'earnings' | 'wins' | 'top10s' | 'movers';

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


export function CollegeMasthead({
  stats,
  college,
  activeMetric,
  heroAlumni: _heroAlumni,
  captain: _captain,
  runnerUp: _runnerUp,
  isTiedAtOne: _isTiedAtOne = false,
  moversContext: _moversContext,
}: CollegeMastheadProps) {
  const navigate = useNavigate();
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const slug = stats.normalized_name;
  const logoUrl = getCollegeLogoUrl(college?.college_name || stats.normalized_name);

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
          background: SLATE_50,
          padding: '16px 16px 14px',
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
            <GraduationCap size={13} strokeWidth={2.5} style={{ color: AMBER }} />
            <span style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: AMBER,
              textTransform: 'uppercase' as const,
            }}>
              COLLEGE FRANCHISE
            </span>
            <ChevronRight size={11} strokeWidth={2.5} style={{ color: AMBER, marginTop: 1 }} />
          </button>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: INK,
            letterSpacing: '-0.005em',
            lineHeight: 1.25,
            margin: '8px 0 0',
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
            background: `linear-gradient(180deg, ${GOLD_TINT_10} 0%, ${GOLD_TINT} 100%)`,
            border: `1px solid ${GOLD_BORDER}`,
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
              <Crown size={13} strokeWidth={2.5} fill={GOLD} style={{ color: GOLD_DEEP, flexShrink: 0 }} />
              <span style={{
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: INK,
                textTransform: 'uppercase' as const,
              }}>
                SEASON LEADER
              </span>
            </div>

            {/* Body row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '34%',
                  overflow: 'hidden',
                  background: SURFACE,
                  border: `2.5px solid ${GOLD}`,
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
                  background: GOLD,
                  color: INK,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 900,
                  border: `2.5px solid ${SURFACE}`,
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
                    color: INK,
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
                    color: INK,
                    letterSpacing: '-0.025em',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {primaryInteger}
                    {primaryDecimal && <span style={{ color: INK }}>{primaryDecimal}</span>}
                    {primarySuffix && <span style={{ color: INK }}>{primarySuffix}</span>}
                  </div>
                  <div style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.16em',
                    color: INK_MUTE,
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
