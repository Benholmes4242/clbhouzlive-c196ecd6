/**
 * AlumniDepthChart — 4-tier alumni leaderboard for the College Franchise
 * individual page. Mirrors the main College leaderboard vocabulary:
 *   • Single column header (PLAYER · W · EARNINGS) up top
 *   • Tier subheaders inline (no coloured bars, no per-row left rails)
 *   • STARS rows get the amber-highlight treatment (AMBER_SOFT_BG +
 *     amber earnings + bold name) — the same look as top-3 on the main page.
 *   • Other tiers (REGULARS / RISING / LEGACY) render as plain rows.
 *
 * Tiers (top to bottom): Stars → Regulars → Rising → Legacy
 * Classification rules unchanged from prior implementation.
 */

import { useState, useMemo } from 'react';
import { AMBER, AMBER_SOFT_BG, INK, INK_FAINT, INK_MUTE, INK_TINT_06, INK_TINT_07, SLATE_600, SURFACE, TREND_UP } from '../../_shared/tokens';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCollegeAlumni, type CollegeAlumnus } from '../../hooks/useCollegeAlumni';
import { useLegacyAlumni } from '../../hooks/useLegacyAlumni';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { PlayerInitialAvatar } from '../shared/PlayerInitialAvatar';
import { getPlayerTourTag } from '../../utils/playerTourTag';
import { TIER_SUBTITLES } from '../../constants/legacyAlumni';
import { playerRoute } from '../../routes';

interface AlumniDepthChartProps {
  normalizedName: string;
  /** Total alumni count for the section eyebrow ("N PLAYERS"). */
  alumniCount?: number;
  className?: string;
}

type TierKey = 'stars' | 'regulars' | 'rising' | 'legacy';

const TIER_COLORS: Record<TierKey, string> = {
  stars:    AMBER,
  regulars: SLATE_600,
  rising:   TREND_UP,
  legacy:   '#7C3AED',
};

const TIER_LABELS: Record<TierKey, string> = {
  stars:    'Stars',
  regulars: 'Regulars',
  rising:   'Rising',
  legacy:   'Legacy',
};

/* ─── Row ───────────────────────────────────────────────────────────────── */

interface AlumniRowProps {
  alumnus: CollegeAlumnus;
  index: number;
  tier: TierKey;
  legacyContextLabel?: string | null;
}

function AlumniRow({ alumnus, index, tier, legacyContextLabel }: AlumniRowProps) {
  const fullName = `${alumnus.first_name} ${alumnus.last_name}`;
  const hasWins = (alumnus.wins || 0) > 0;
  const hasEarnings = (alumnus.earnings || 0) > 0;
  const liveRank = alumnus.world_ranking && alumnus.world_ranking > 0 && alumnus.world_ranking < 500
    ? alumnus.world_ranking
    : null;
  const photoCandidates = getPlayerHeadshotCandidates(fullName, alumnus.tour_codes?.[0] ?? 'pga');
  const tourTag = getPlayerTourTag(alumnus.tour_codes);

  const subline = tier === 'legacy'
    ? (legacyContextLabel ?? 'Major champion · Program history')
    : liveRank ? `#${liveRank} OWGR` : null;

  // Amber-highlight treatment for Stars — mirrors top-3 on the main College leaderboard.
  const isStars = tier === 'stars';
  const rowBg = isStars ? AMBER_SOFT_BG : 'transparent';
  const nameWeight = isStars ? 800 : 700;
  const earningsColor = hasEarnings ? (isStars ? AMBER : INK) : INK_FAINT;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
    >
      <Link
        {...playerRoute(alumnus.id, alumnus.college ? { kind: 'college', collegeName: alumnus.college } : undefined)}
        aria-label={`${fullName}, ${subline ?? 'tour alumnus'}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: `${isStars ? 12 : 11}px 16px`,
          borderBottom: `0.5px solid ${INK_TINT_07}`,
          background: rowBg,
          textDecoration: 'none',
        }}
        className="active:bg-black/[0.02] transition-colors"
      >
        {/* Player headshot + name + subline */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <PlayerInitialAvatar
            name={fullName}
            srcCandidates={photoCandidates}
            paletteSeed={alumnus.id}
            size={isStars ? 36 : 32}
            radius={11}
            color={tier === 'legacy'
              ? { bg: 'rgba(124,58,237,0.10)', fg: '#7C3AED' }
              : undefined}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <p style={{
                fontSize: 14,
                fontWeight: nameWeight,
                color: INK,
                margin: 0,
                letterSpacing: isStars ? '-0.01em' : 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap' as const,
              }}>
                {fullName}
              </p>
              {tourTag && (
                <span style={{
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  padding: '1px 4px',
                  borderRadius: 3,
                  background: tourTag.bg,
                  color: tourTag.fg,
                  flexShrink: 0,
                }}>
                  {tourTag.label}
                </span>
              )}
            </div>
            {subline && (
              <div style={{ fontSize: 10, fontWeight: 500, color: INK_FAINT, marginTop: 1 }}>
                {subline}
              </div>
            )}
          </div>
        </div>

        {/* W (value only — header labels the column) */}
        <span style={{
          width: 28,
          textAlign: 'center' as const,
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 700,
          color: hasWins ? INK_MUTE : INK_FAINT,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {hasWins ? alumnus.wins : '—'}
        </span>

        {/* EARNINGS */}
        <span style={{
          width: 78,
          textAlign: 'right' as const,
          flexShrink: 0,
          fontSize: 14,
          fontWeight: 800,
          color: earningsColor,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.005em',
        }}>
          {hasEarnings ? formatCurrency(alumnus.earnings ?? 0) : '—'}
        </span>
      </Link>
    </motion.div>
  );
}

/* ─── Tier subheader (quiet inline row) ─────────────────────────────────── */

interface TierHeaderRowProps {
  tier: TierKey;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function TierHeaderRow({ tier, count, isExpanded, onToggle }: TierHeaderRowProps) {
  const tierColor = TIER_COLORS[tier];
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px 8px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left' as const,
        borderTop: `0.5px solid ${INK_TINT_07}`,
      }}
    >
      <span style={{
        fontSize: 11,
        fontWeight: 800,
        color: tierColor,
        letterSpacing: '0.14em',
        textTransform: 'uppercase' as const,
      }}>
        {TIER_LABELS[tier].toUpperCase()}
      </span>
      <span style={{ fontSize: 10, fontWeight: 500, color: INK_FAINT, letterSpacing: '0.04em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
        {TIER_SUBTITLES[tier]}
      </span>
      <span style={{ fontSize: 11, color: INK_FAINT, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
      <span style={{ fontSize: 11, color: INK_FAINT }}>{isExpanded ? '▾' : '▸'}</span>
    </button>
  );
}

/* ─── Section ───────────────────────────────────────────────────────────── */

interface SectionProps {
  tier: TierKey;
  alumni: CollegeAlumnus[];
  defaultExpanded?: boolean;
  legacyMap?: ReadonlyMap<string, string>;
}

function Section({ tier, alumni, defaultExpanded = true, legacyMap }: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const COLLAPSED_COUNT = 3;

  if (alumni.length === 0) return null;

  const displayedAlumni = isExpanded ? alumni : alumni.slice(0, COLLAPSED_COUNT);
  const hasMore = alumni.length > COLLAPSED_COUNT;

  return (
    <>
      <TierHeaderRow
        tier={tier}
        count={alumni.length}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(v => !v)}
      />
      {isExpanded && (
        <>
          {displayedAlumni.map((alumnus, index) => (
            <AlumniRow
              key={alumnus.id}
              alumnus={alumnus}
              index={index}
              tier={tier}
              legacyContextLabel={tier === 'legacy' ? legacyMap?.get(alumnus.id) ?? null : null}
            />
          ))}
          {hasMore && (
            <button
              onClick={() => setIsExpanded(v => !v)}
              style={{
                width: '100%',
                padding: '10px 0',
                fontSize: 12,
                fontWeight: 700,
                color: INK,
                background: 'transparent',
                border: 'none',
                borderBottom: `0.5px solid ${INK_TINT_07}`,
                cursor: 'pointer',
              }}
            >
              Show less ▴
            </button>
          )}
        </>
      )}
    </>
  );
}

/* ─── Classifier ────────────────────────────────────────────────────────── */

function classifyTier(a: CollegeAlumnus, legacyMap: ReadonlyMap<string, string>): TierKey {
  const rank = a.world_ranking && a.world_ranking > 0 ? a.world_ranking : null;
  const wins = a.wins ?? 0;
  const events = a.events_played ?? 0;
  const isMajorChamp = legacyMap.has(a.id);

  if (isMajorChamp && events === 0) return 'legacy';
  if ((rank !== null && rank <= 50) || wins >= 1) return 'stars';
  if (rank !== null && rank >= 51 && rank <= 200 && events >= 3) return 'regulars';
  if ((rank === null || rank > 200) && events >= 1) return 'rising';
  return 'rising';
}

/* ─── Component ─────────────────────────────────────────────────────────── */

const EMPTY_LEGACY_MAP: ReadonlyMap<string, string> = new Map();

export function AlumniDepthChart({ normalizedName, alumniCount, className }: AlumniDepthChartProps) {
  const { data: alumni, isLoading, error } = useCollegeAlumni(normalizedName, {
    orderBy: 'earnings',
    limit: 50,
  });
  const { data: legacyMap = EMPTY_LEGACY_MAP } = useLegacyAlumni();

  const tiers = useMemo(() => {
    const buckets: Record<TierKey, CollegeAlumnus[]> = {
      stars: [], regulars: [], rising: [], legacy: [],
    };
    if (!alumni) return buckets;
    for (const a of alumni) {
      buckets[classifyTier(a, legacyMap)].push(a);
    }
    return buckets;
  }, [alumni, legacyMap]);

  if (isLoading) {
    return (
      <div className={cn('', className)} style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}` }}>
        <SectionHeader count={null} />
        <ColumnHeader />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: `0.5px solid ${INK_TINT_07}` }}>
            <div style={{ width: 32, height: 32, borderRadius: 11, background: INK_TINT_06, flexShrink: 0 }} />
            <div style={{ flex: 1, height: 13, borderRadius: 4, background: INK_TINT_06 }} />
            <div style={{ width: 28, height: 12, borderRadius: 4, background: INK_TINT_06 }} />
            <div style={{ width: 64, height: 12, borderRadius: 4, background: INK_TINT_06 }} />
          </div>
        ))}
      </div>
    );
  }

  if (error || !alumni?.length) {
    return (
      <div className={cn('text-center py-12 text-sm text-muted-foreground', className)} style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}` }}>
        No alumni found for this college
      </div>
    );
  }

  return (
    <div
      className={cn('', className)}
      style={{
        background: SURFACE,
        borderTop: `0.5px solid ${INK_TINT_07}`,
        borderBottom: `0.5px solid ${INK_TINT_07}`,
      }}
    >
      <SectionHeader count={alumniCount ?? alumni.length} />
      <ColumnHeader />
      <Section tier="stars"    alumni={tiers.stars}    defaultExpanded />
      <Section tier="regulars" alumni={tiers.regulars} defaultExpanded={tiers.regulars.length <= 5} />
      <Section tier="rising"   alumni={tiers.rising}   defaultExpanded={false} />
      <Section tier="legacy"   alumni={tiers.legacy}   defaultExpanded legacyMap={legacyMap} />
    </div>
  );
}

/* ─── Section eyebrow + column header ───────────────────────────────────── */

function SectionHeader({ count }: { count: number | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '12px 16px 8px' }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
        Alumni on Tour
      </span>
      {count != null && (
        <span style={{ fontSize: 9, fontWeight: 800, color: INK_FAINT, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>
          <span style={{ color: INK }}>{count}</span> PLAYERS
        </span>
      )}
    </div>
  );
}

function ColumnHeader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '8px 16px',
      borderTop: `0.5px solid ${INK_TINT_07}`,
      borderBottom: `0.5px solid ${INK_TINT_07}`,
    }}>
      <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
        Player
      </span>
      <span style={{ width: 28, textAlign: 'center' as const, fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
        W
      </span>
      <span style={{ width: 78, textAlign: 'right' as const, fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
        Earnings
      </span>
    </div>
  );
}
