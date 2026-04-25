/**
 * StatOfTheWeek — Phase E cream-paper editorial spread.
 *
 * Replaces SeasonLeaderboards on the Tour Hub Overview only. The legacy
 * SeasonLeaderboards folder is preserved (no other consumer; deletion is
 * logged as a separate cleanup brief).
 *
 * Featured stat = category with the largest absolute #1-vs-#2 margin
 * across leaderboards (Decision 2). Editorial copy reads from
 * championship_editorial_daily (surface = 'stat_of_week') with
 * STAT_OF_WEEK_FALLBACK as the V1 fallback.
 *
 * Player meta line renders age + turned_pro from sr_players (Decision 3
 * Path e — schema verified Apr 2026, ~73% birth_date / ~63% turned_pro
 * coverage). No wins column exists on sr_players, so the wins clause from
 * the design comp is omitted to preserve data integrity.
 *
 * Per Tour Hub redesign brief Phase E.
 */

import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import {
  useSeasonLeaderboards,
  type CategoryId,
  type LeaderboardCategory,
  type LeaderboardPlayer,
} from '../hooks/useSeasonLeaderboards';
import { useDailyEditorial } from '@/hooks/championship/useDailyEditorial';
import { STAT_OF_WEEK_FALLBACK } from '../utils/editorialFallbacks';
import { PlayerAvatar } from './PlayerAvatar';
import CountryFlag from '@/components/ui/country-flag';

// ─── Category navigator pills ────────────────────────────────────────────────
const NAVIGATOR_CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'earnings',    label: 'Earnings' },
  { id: 'sg_total',    label: 'SG Total' },
  { id: 'scoring_avg', label: 'Scoring' },
  { id: 'putting',     label: 'Putting' },
  { id: 'gir_pct',     label: 'GIR' },
  { id: 'sand_saves',  label: 'Sand' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function computeAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate + 'T00:00:00');
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 && age < 100 ? age : null;
}

function buildMetaLine(player: LeaderboardPlayer): string {
  const parts: string[] = [];
  const age = computeAge(player.birthDate);
  if (age !== null) parts.push(`${age} yrs`);
  if (player.turnedPro) parts.push(`Pro since ${player.turnedPro}`);
  return parts.join(' · ');
}

// ─── Format margin to #2 ────────────────────────────────────────────────────
function formatMargin(category: LeaderboardCategory): string | null {
  if (category.players.length < 2) return null;
  const margin = Math.abs(category.players[0].statValue - category.players[1].statValue);
  // Use category formatter for unit context where possible
  if (category.players[0].statUnit === 'yds') {
    return `${margin.toFixed(1)} yds`;
  }
  if (category.players[0].statUnit === '%') {
    return `${margin.toFixed(1)}%`;
  }
  if (category.id === 'earnings') {
    if (margin >= 1_000_000) return `$${(margin / 1_000_000).toFixed(1)}M`;
    if (margin >= 1_000) return `$${(margin / 1_000).toFixed(0)}K`;
    return `$${Math.round(margin)}`;
  }
  return margin.toFixed(2);
}

// ─── Split a stat display value into integer / decimal parts ────────────────
interface SplitStat {
  main: string;     // "325" or "$13"
  decimal: string;  // ".2" or ".5M" — may include unit suffix when needed
  unit: string;
}

function splitStatDisplay(player: LeaderboardPlayer): SplitStat {
  const raw = player.statDisplayValue;
  // Find first decimal point
  const dotIdx = raw.indexOf('.');
  if (dotIdx === -1) {
    return { main: raw, decimal: '', unit: player.statUnit };
  }
  // Decimal portion may include trailing letters (e.g. "$13.2M" → main "$13", decimal ".2M")
  const main = raw.slice(0, dotIdx);
  const decimal = raw.slice(dotIdx);
  return { main, decimal, unit: player.statUnit };
}

// ─── Subhead with margin-to-#2 context ──────────────────────────────────────
function buildSubhead(category: LeaderboardCategory): string {
  const margin = formatMargin(category);
  const leader = category.players[0];
  if (!leader || !margin) return STAT_OF_WEEK_FALLBACK.subhead;
  const lastName = leader.lastName || leader.playerName;
  return `${lastName} leads the field by ${margin} — the largest margin in any 2026 statistical category.`;
}

// ─── Main ───────────────────────────────────────────────────────────────────
export const StatOfTheWeek = memo(function StatOfTheWeek() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const { data: leaderboards, isLoading, error } = useSeasonLeaderboards(currentYear);
  const { data: editorial } = useDailyEditorial({
    surface: 'stat_of_week',
    seasonId: null,
    timeFilter: 'all_time',
  });

  // ─── Compute featured category by largest #1-vs-#2 margin ──────────────
  const autoFeatured = useMemo(() => {
    if (!leaderboards?.categories) return null;
    const ranked = leaderboards.categories
      .filter((c) => c.players.length >= 2)
      .map((c) => ({
        category: c,
        margin: Math.abs(c.players[0].statValue - c.players[1].statValue),
      }))
      .sort((a, b) => {
        if (b.margin !== a.margin) return b.margin - a.margin;
        // Tie-breaker: alphabetical category id (deterministic)
        return a.category.id.localeCompare(b.category.id);
      });
    return ranked[0]?.category ?? null;
  }, [leaderboards]);

  // ─── Allow user to rotate via navigator pills ──────────────────────────
  const [selectedId, setSelectedId] = useState<CategoryId | null>(null);

  const featured = useMemo(() => {
    if (selectedId && leaderboards?.categories) {
      return (
        leaderboards.categories.find((c) => c.id === selectedId) ?? autoFeatured
      );
    }
    return autoFeatured;
  }, [selectedId, leaderboards, autoFeatured]);

  // ─── Loading skeleton ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <section className="px-4" aria-label="Stat of the Week">
        <div
          style={{
            background: '#FAF7F2',
            borderRadius: 20,
            padding: '24px 22px 20px',
            minHeight: 360,
            boxShadow:
              '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.08)',
          }}
        >
          <div className="h-3 w-32 rounded bg-muted/40 animate-pulse mb-4" />
          <div className="h-20 w-44 rounded bg-muted/40 animate-pulse mb-4" />
          <div className="h-12 w-full rounded bg-muted/40 animate-pulse mb-3" />
          <div className="h-3 w-3/4 rounded bg-muted/40 animate-pulse" />
        </div>
      </section>
    );
  }

  // ─── Error or no data → graceful fallback to constants ────────────────
  const hasCategoryData = !!featured && featured.players.length >= 1;
  if (error && !hasCategoryData) return null;

  // Use fallback constants when no live category is available
  const fallback = STAT_OF_WEEK_FALLBACK;
  const leader = hasCategoryData ? featured!.players[0] : null;

  // ─── Eyebrow / category label ─────────────────────────────────────────
  const eyebrow = editorial?.eyebrow
    ?? (featured?.name ? featured.name.toUpperCase() : fallback.category);
  const categoryIcon = featured?.icon ?? fallback.categoryIcon;

  // ─── The Number (split for visual treatment) ──────────────────────────
  const split: SplitStat = leader
    ? splitStatDisplay(leader)
    : { main: fallback.bigNumber, decimal: fallback.decimal, unit: fallback.unit };

  // ─── The Story ────────────────────────────────────────────────────────
  const headlineLead = leader ? leader.playerName : fallback.headlineLead;
  const headlineBody =
    editorial?.headlineTwo
      || editorial?.headline
      || (leader
        ? `is leading the tour in ${(featured?.name || '').toLowerCase()} this season.`
        : fallback.headlineBody);
  const subhead =
    editorial?.standfirst
      || (featured ? buildSubhead(featured) : fallback.subhead);

  // ─── Player meta line ─────────────────────────────────────────────────
  const metaLine = leader ? buildMetaLine(leader) : fallback.playerMeta;
  const metaLineFinal = metaLine.length > 0 ? metaLine : fallback.playerMeta;

  // ─── Mini chasers ─────────────────────────────────────────────────────
  const chasers = featured && featured.players.length >= 4
    ? featured.players.slice(1, 4).map((p) => ({
        rank: p.rank,
        name: p.lastName || p.playerName,
        value: p.statDisplayValue,
      }))
    : fallback.chasers;

  return (
    <section className="px-4" aria-label="Stat of the Week">
      <div
        style={{
          position: 'relative',
          background: '#FAF7F2',
          borderRadius: 20,
          padding: '24px 22px 20px',
          boxShadow:
            '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Decorative amber gradient bleed top-right */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            background:
              'radial-gradient(circle, rgba(247,147,30,0.1) 0%, rgba(247,147,30,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* ─── Eyebrow row ───────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 14 }}>{categoryIcon}</span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: '#B8770F',
              letterSpacing: '0.18em',
              textTransform: 'uppercase' as const,
              whiteSpace: 'nowrap' as const,
            }}
          >
            {eyebrow}
          </span>
          <div
            style={{
              flex: 1,
              height: 1,
              background: 'rgba(15,23,42,0.1)',
            }}
          />
        </div>

        {/* ─── The Number ───────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 4,
            marginBottom: 18,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontSize: 88,
              fontWeight: 900,
              color: '#0F172A',
              letterSpacing: '-0.04em',
              lineHeight: 0.9,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {split.main}
          </span>
          {split.decimal && (
            <span
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: '#F7931E',
                letterSpacing: '-0.01em',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                paddingBottom: 4,
              }}
            >
              {split.decimal}
            </span>
          )}
          {split.unit && (
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#64748B',
                paddingBottom: 8,
                marginLeft: 2,
              }}
            >
              {split.unit}
            </span>
          )}
        </div>

        {/* ─── The Story ─────────────────────────────────────────────── */}
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              backgroundImage:
                'linear-gradient(180deg, transparent 65%, rgba(247,147,30,0.3) 65%)',
              backgroundRepeat: 'no-repeat',
              paddingRight: 2,
            }}
          >
            {headlineLead}
          </span>{' '}
          <span style={{ fontWeight: 600 }}>{headlineBody}</span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#475569',
            lineHeight: 1.5,
            marginBottom: 18,
          }}
        >
          {subhead}
        </div>

        {/* ─── Player attribution row ────────────────────────────────── */}
        {leader && (
          <button
            onClick={() => navigate(`/tourhub/player/${leader.playerId}`)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              marginBottom: 18,
              textAlign: 'left' as const,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 36,
                height: 36,
                borderRadius: '50%',
                padding: 2,
                background: '#F7931E',
                flexShrink: 0,
              }}
            >
              <PlayerAvatar
                playerId={leader.playerId}
                playerName={leader.playerName}
                tourCode={leader.tourCode || 'pga'}
                size="sm"
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#0F172A',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap' as const,
                    overflow: 'hidden' as const,
                    textOverflow: 'ellipsis' as const,
                  }}
                >
                  {leader.playerName}
                </span>
                <CountryFlag country={leader.countryCode} size="sm" />
              </div>
              {metaLineFinal && (
                <div style={{ fontSize: 10, color: '#94A3B8' }}>{metaLineFinal}</div>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(22,163,74,0.1)',
                padding: '4px 8px',
                borderRadius: 12,
                flexShrink: 0,
              }}
            >
              <ArrowUp style={{ width: 10, height: 10, color: '#16A34A' }} />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  color: '#16A34A',
                  letterSpacing: '0.1em',
                }}
              >
                SEASON HIGH
              </span>
            </div>
          </button>
        )}

        {/* ─── Mini chasers strip ────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginBottom: 18,
          }}
        >
          {chasers.slice(0, 3).map((c) => (
            <div
              key={`${c.rank}-${c.name}`}
              style={{
                background: '#ffffff',
                borderRadius: 10,
                padding: '8px 10px',
                border: '0.5px solid rgba(15,23,42,0.06)',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  color: '#94A3B8',
                  letterSpacing: '0.08em',
                  marginBottom: 2,
                }}
              >
                #{c.rank}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#0F172A',
                  whiteSpace: 'nowrap' as const,
                  overflow: 'hidden' as const,
                  textOverflow: 'ellipsis' as const,
                  marginBottom: 1,
                }}
              >
                {c.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#475569',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {c.value}
              </div>
            </div>
          ))}
        </div>

        {/* ─── Category navigator ────────────────────────────────────── */}
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: '#94A3B8',
              letterSpacing: '0.18em',
              textTransform: 'uppercase' as const,
              marginBottom: 8,
            }}
          >
            More stats
          </div>
          <div
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto' as const,
              WebkitOverflowScrolling: 'touch' as const,
              scrollbarWidth: 'none' as const,
              paddingBottom: 2,
            }}
          >
            {NAVIGATOR_CATEGORIES.map((cat) => {
              const isActive =
                (selectedId ?? autoFeatured?.id) === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedId(cat.id)}
                  style={{
                    flexShrink: 0,
                    padding: '6px 12px',
                    borderRadius: 16,
                    border: isActive
                      ? '1px solid #F7931E'
                      : '1px solid rgba(15,23,42,0.1)',
                    background: isActive ? 'rgba(247,147,30,0.1)' : '#ffffff',
                    fontSize: 11,
                    fontWeight: 700,
                    color: isActive ? '#B8770F' : '#475569',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap' as const,
                  }}
                  className="active:scale-[0.96] transition-transform"
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
});
