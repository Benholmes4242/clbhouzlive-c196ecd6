/**
 * AlumniDepthChart — 4-tier alumni depth chart for the College Franchise
 * individual page (Phase 1 fix step).
 *
 * Tiers (top to bottom): Stars → Regulars → Rising → Legacy
 *
 * Criterion (locked in brief):
 *   - STARS    (amber)     — OWGR ≤ 50 OR ≥1 win this season
 *   - REGULARS (slate-600) — OWGR 51–200 AND ≥3 events this season
 *   - RISING   (green)     — OWGR > 200 OR no current ranking, with ≥1 event
 *   - LEGACY   (purple)    — major champion AND no events this season
 *
 * Conflict resolution: Stars > Regulars > Rising. Legacy is mutually exclusive
 * (requires no current activity AND a major-champion editorial allow-list).
 *
 * Data caveats handled:
 *   - world_ranking === 0 is treated as NULL (stale Sportradar default)
 *   - Cross-tour rankings unavailable → LPGA/DPWT alumni surface as Rising
 *     unless they're in LEGACY_ALUMNI_IDS
 *   - career_major_wins column doesn't exist → Legacy is editorial allow-list
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCollegeAlumni, type CollegeAlumnus } from '../../hooks/useCollegeAlumni';
import { useLegacyAlumni } from '../../hooks/useLegacyAlumni';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { PlayerInitialAvatar } from '../shared/PlayerInitialAvatar';
import { getPlayerTourTag } from '../../utils/playerTourTag';
import { TIER_SUBTITLES } from '../../constants/legacyAlumni';

interface AlumniDepthChartProps {
  normalizedName: string;
  className?: string;
}

type TierKey = 'stars' | 'regulars' | 'rising' | 'legacy';

const TIER_COLORS: Record<TierKey, string> = {
  stars:    '#F7931E', // amber
  regulars: '#475569', // slate-600 (replaces off-brand iOS blue)
  rising:   '#16A34A', // green
  legacy:   '#7C3AED', // purple (NEW)
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
  // world_ranking === 0 is the Sportradar "no rank" sentinel, treat as null
  const liveRank = alumnus.world_ranking && alumnus.world_ranking > 0 && alumnus.world_ranking < 500
    ? alumnus.world_ranking
    : null;
  const photoUrl = getPlayerHeadshotUrl(fullName, alumnus.tour_codes?.[0] ?? 'pga');
  const tourTag = getPlayerTourTag(alumnus.tour_codes);

  // Legacy rows show editorial context line (from legacy_alumni table);
  // others show OWGR when available.
  const subline = tier === 'legacy'
    ? (legacyContextLabel ?? 'Major champion · Program history')
    : liveRank ? `#${liveRank} OWGR` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
    >
      <Link
        to={`/tourhub/player/${alumnus.id}`}
        aria-label={`${fullName}, ${subline ?? 'tour alumnus'}`}
        style={{
          display: 'flex', alignItems: 'center',
          padding: '10px 16px',
          borderBottom: '0.5px solid rgba(15,23,42,0.07)',
          borderLeft: `3px solid ${TIER_COLORS[tier]}`,
          textDecoration: 'none',
        }}
        className="active:bg-black/[0.02] transition-colors"
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
          <PlayerInitialAvatar
            name={fullName}
            src={photoUrl}
            size={32}
            radius={11}
            color={tier === 'legacy'
              ? { bg: 'rgba(124,58,237,0.10)', fg: '#7C3AED' }
              : undefined}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <div style={{
                fontSize: 14, fontWeight: 800, color: '#0F172A',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                letterSpacing: '-0.3px',
              }}>
                {fullName}
              </div>
              {tourTag && (
                <span style={{
                  fontSize: 8, fontWeight: 800, letterSpacing: '0.5px',
                  padding: '1px 4px', borderRadius: 3,
                  background: tourTag.bg, color: tourTag.fg,
                  flexShrink: 0,
                }}>
                  {tourTag.label}
                </span>
              )}
            </div>
            {subline && (
              <div style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', marginTop: 1 }}>
                {subline}
              </div>
            )}
          </div>
        </div>

        {/* EARN */}
        <div style={{ width: 56, textAlign: 'right' as const, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', letterSpacing: '0.04em' }}>EARN</div>
          <div style={{
            fontSize: 13, fontWeight: 800, color: hasEarnings ? '#F7931E' : '#94A3B8',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {hasEarnings ? formatCurrency(alumnus.earnings ?? 0) : '—'}
          </div>
        </div>

        {/* W */}
        <div style={{ width: 36, textAlign: 'right' as const, flexShrink: 0, marginLeft: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', letterSpacing: '0.04em' }}>W</div>
          <div style={{
            fontSize: 13, fontWeight: 800,
            color: hasWins ? '#0F172A' : '#94A3B8',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {hasWins ? alumnus.wins : '—'}
          </div>
        </div>
      </Link>
    </motion.div>
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
  const tierColor = TIER_COLORS[tier];

  return (
    <div style={{ marginBottom: 0 }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%', display: 'flex', alignItems: 'baseline', gap: 10,
          padding: '12px 16px 8px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left' as const,
          borderTop: '0.5px solid rgba(15,23,42,0.07)',
        }}
      >
        <div style={{ width: 3, height: 12, background: tierColor, borderRadius: 1, flexShrink: 0, alignSelf: 'center' }} />
        <span style={{ fontSize: 12, fontWeight: 800, color: tierColor, letterSpacing: '1.2px', textTransform: 'uppercase' as const }}>
          {TIER_LABELS[tier].toUpperCase()}
        </span>
        <span style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', letterSpacing: '0.2px', flex: 1 }}>
          {TIER_SUBTITLES[tier]}
        </span>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>{alumni.length}</span>
        <span style={{ fontSize: 11, color: '#CBD5E1' }}>{isExpanded ? '▾' : '▸'}</span>
      </button>

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
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                width: '100%', padding: '10px 0', fontSize: 12, fontWeight: 700,
                color: '#0F172A', background: 'transparent', border: 'none',
                borderTop: '0.5px solid rgba(15,23,42,0.07)', cursor: 'pointer',
              }}
            >
              {isExpanded ? `View all ${alumni.length} ▾` : 'Show less ▴'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Classifier ────────────────────────────────────────────────────────── */

function classifyTier(a: CollegeAlumnus, legacyMap: ReadonlyMap<string, string>): TierKey {
  // Sportradar uses 0 as "no rank" sentinel; treat as null
  const rank = a.world_ranking && a.world_ranking > 0 ? a.world_ranking : null;
  const wins = a.wins ?? 0;
  const events = a.events_played ?? 0;
  const isMajorChamp = legacyMap.has(a.id);

  // Legacy is mutually exclusive: major champ AND inactive this season
  if (isMajorChamp && events === 0) return 'legacy';

  // Stars: top OWGR or recent winners
  if ((rank !== null && rank <= 50) || wins >= 1) return 'stars';

  // Regulars: ranked 51–200 AND consistent activity
  if (rank !== null && rank >= 51 && rank <= 200 && events >= 3) return 'regulars';

  // Rising: outside top 200, or no rank, but at least one event
  if ((rank === null || rank > 200) && events >= 1) return 'rising';

  // Inactive non-major-champion alumni fall through to Rising as the
  // honest "no current activity" bucket — Phase 1 fallback for cross-tour
  // ranking gaps. (LPGA/DPWT alumni without OWGR land here.)
  return 'rising';
}

/* ─── Component ─────────────────────────────────────────────────────────── */

const EMPTY_LEGACY_MAP: ReadonlyMap<string, string> = new Map();

export function AlumniDepthChart({ normalizedName, className }: AlumniDepthChartProps) {
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
      <div className={cn('', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 11, background: 'rgba(15,23,42,0.06)', flexShrink: 0 }} />
            <div style={{ flex: 1, height: 13, borderRadius: 4, background: 'rgba(15,23,42,0.06)' }} />
            <div style={{ width: 56, height: 12, borderRadius: 4, background: 'rgba(15,23,42,0.06)' }} />
          </div>
        ))}
      </div>
    );
  }

  if (error || !alumni?.length) {
    return (
      <div className={cn('text-center py-12 text-sm text-muted-foreground', className)}>
        No alumni found for this college
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      <Section tier="stars"    alumni={tiers.stars}    defaultExpanded />
      <Section tier="regulars" alumni={tiers.regulars} defaultExpanded={tiers.regulars.length <= 5} />
      <Section tier="rising"   alumni={tiers.rising}   defaultExpanded={false} />
      <Section tier="legacy"   alumni={tiers.legacy}   defaultExpanded legacyMap={legacyMap} />
    </div>
  );
}
