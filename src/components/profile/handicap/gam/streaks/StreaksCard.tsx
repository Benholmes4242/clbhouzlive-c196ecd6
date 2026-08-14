import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { DarkSectionHeader } from '../../whs/sections/_shared/darkAtoms';
import { Skeleton } from '../_shared/GamAtoms';
import { useUserStreaks } from '@/hooks/gam/useUserStreaks';
import type { StreakRow } from '@/lib/gam/types';
import { STREAK_CARD_CONFIG, type StreakCardEntry } from './streakConfig';
import { selectFeaturedStreaks } from './selectFeaturedStreaks';
import { milestoneFor } from './streakMilestones';
import { openAllStreaks } from '../../whs/gam/events';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { formatRelativeAgo } from '@/i18n/format';
const relativeTime = (iso: string | null) => formatRelativeAgo(iso, { yesterday: true });

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const AMBER = '#F7931E';

interface Props {
  userId: string;
  /**
   * Friend-view (read-only) mounts hide the "See all" affordance because the
   * StreaksSheet is owner-only (mounted only on the viewer's own page).
   */
  readOnly?: boolean;
}

type StreakState = 'atpb' | 'active' | 'dormant';

interface StreakStateToken {
  cardBorder: string;
  glyphColor: string;
  stateLabel: string;
  stateLabelColor: string;
  figureColor: string;
  progressFill: string;
}

const STREAK_STATE_TOKENS: Record<StreakState, StreakStateToken> = {
  atpb: {
    cardBorder: 'var(--hcp-line)',
    glyphColor: AMBER,
    stateLabel: 'AT YOUR PB',
    stateLabelColor: 'var(--hcp-t-60)',
    figureColor: AMBER,
    progressFill: AMBER,
  },
  active: {
    cardBorder: 'var(--hcp-line)',
    glyphColor: AMBER,
    stateLabel: 'ACTIVE',
    stateLabelColor: 'var(--hcp-t-60)',
    figureColor: 'var(--hcp-t-100)',
    progressFill: AMBER,
  },
  dormant: {
    cardBorder: 'var(--hcp-line)',
    glyphColor: 'var(--hcp-t-40)',
    stateLabel: 'DORMANT',
    stateLabelColor: 'var(--hcp-t-40)',
    figureColor: 'var(--hcp-t-100)',
    progressFill: 'rgba(255,255,255,0.20)',
  },
};


function streakStateFor(row: StreakRow | null | undefined): StreakState {
  if (!row) return 'dormant';
  const current = row.current_count ?? 0;
  const best = row.best_count ?? 0;
  const isActive = !!row.is_active && current > 0;
  if (isActive && current === best) return 'atpb';
  if (isActive) return 'active';
  return 'dormant';
}

// ──────────────────────────────────────────────────────────────────
// Dot pager (inlined; mirrors RecentUnlocksStrip's pattern)
// ──────────────────────────────────────────────────────────────────

const DotPager: React.FC<{
  total: number;
  current: number;
  onChange: (n: number) => void;
}> = ({ total, current, onChange }) => {
  if (total <= 1) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
      }}
    >
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to streak ${i + 1}`}
          aria-current={i === current ? 'true' : undefined}
          onClick={() => i !== current && onChange(i)}
          style={{
            width: i === current ? 18 : 6,
            height: 6,
            borderRadius: 999,
            background: i === current ? 'var(--hcp-t-100)' : 'var(--hcp-t-30)',
            border: 'none',
            padding: 0,
            cursor: i === current ? 'default' : 'pointer',
            transition: 'all 200ms ease',
            WebkitTapHighlightColor: 'transparent',
          }}
        />
      ))}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────
// Streak hero card
// ──────────────────────────────────────────────────────────────────

interface StreakHeroCardProps {
  entry: StreakCardEntry;
  row: StreakRow | null | undefined;
}

const StreakHeroCard: React.FC<StreakHeroCardProps> = ({ entry, row }) => {
  const state = streakStateFor(row);
  const tokens = STREAK_STATE_TOKENS[state];
  const current = row?.current_count ?? 0;
  const best = row?.best_count ?? 0;
  const milestone = milestoneFor(entry.type, current);

  const progressTarget = milestone ?? best;
  const progressPct =
    milestone == null
      ? 100
      : progressTarget > 0
        ? Math.min(100, (current / progressTarget) * 100)
        : 0;

  // Hint copy removed: the state label and progress labels already say it once.


  const meta =
    state === 'atpb' || state === 'active'
      ? row?.current_started_at
        ? `Started ${relativeTime(row.current_started_at)}`
        : null
      : best > 0 && row?.best_ended_at
        ? `Last broken ${relativeTime(row.best_ended_at)}`
        : null;

  const progressLeft: string =
    milestone == null
      ? `PB · ${best}`
      : current === best && current > 0
        ? `PB · ${best} (matched)`
        : best > 0
          ? `${current} of ${milestone}`
          : `Target · ${milestone}`;

  const progressRight: string =
    milestone == null
      ? 'Legendary streak'
      : state === 'atpb'
        ? `${entry.actionVerb} to extend`
        : state === 'active' && best > 0 && current < best
          ? `${best - current} more to beat PB`
          : state === 'dormant' && best > 0
            ? `${entry.actionVerb} to start`
            : `${milestone - current} to milestone`;

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        boxSizing: 'border-box',
        padding: '16px 16px 14px',
        borderRadius: 16,
        overflow: 'hidden',
        minHeight: 172,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--hcp-bg-1)',
        border: `1px solid ${tokens.cardBorder}`,
        fontFamily: FONT,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Glyph + state + meta */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            color: tokens.glyphColor,
            flexShrink: 0,
          }}
        >
          <entry.Icon size={13} strokeWidth={2} />
        </span>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: tokens.stateLabelColor,
          }}
        >
          {tokens.stateLabel}
        </span>
        {meta && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--hcp-t-40)',
              whiteSpace: 'nowrap',
            }}
          >
            {meta}
          </span>
        )}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 14.5,
          fontWeight: 700,
          letterSpacing: '-0.025em',
          color: 'var(--hcp-t-100)',
          lineHeight: 1.2,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {entry.label}
      </div>

      {/* Bottom block: figure + bar + labels */}
      <div style={{ marginTop: 'auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 5,
            marginTop: 12,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: tokens.figureColor,
              lineHeight: 1,
              letterSpacing: '-0.045em',
              fontVariantNumeric: 'tabular-nums lining-nums',
              fontFeatureSettings: '"kern" 1, "liga" 1',
            }}
          >
            {current}
          </span>
          <span style={{ fontSize: 13, color: 'var(--hcp-t-60)', fontWeight: 600 }}>
            {entry.unit}
          </span>
        </div>

        <StreakTrack
          current={current}
          milestone={milestone}
          best={best}
          state={state}
          fill={tokens.progressFill}
          progressPct={progressPct}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
            fontSize: 7.5,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--hcp-t-60)',
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          <span>{progressLeft}</span>
          <span style={{ color: 'var(--hcp-t-40)', textAlign: 'right' }}>{progressRight}</span>
        </div>
      </div>
    </div>
  );

};

// ──────────────────────────────────────────────────────────────────
// Section
// ──────────────────────────────────────────────────────────────────

/**
 * Distance from one snap child's start to the next: measured from the two
 * children's offsetLeft so a track `gap` is included automatically.
 */
function childStride(el: HTMLElement): number {
  const first = el.children[0] as HTMLElement | undefined;
  if (!first) return el.clientWidth;
  const second = el.children[1] as HTMLElement | undefined;
  if (second) return second.offsetLeft - first.offsetLeft;
  return first.clientWidth || el.clientWidth;
}

export const StreaksCard: React.FC<Props> = ({ userId, readOnly = false }) => {
  const { data, isLoading } = useUserStreaks(userId);
  const sectionRef = useRef<HTMLElement | null>(null);
  const firedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(0);

  const featured = useMemo(() => selectFeaturedStreaks(data ?? []), [data]);

  const activeCount = useMemo(
    () =>
      (data ?? []).filter(
        (r) => r.is_active && (r.current_count ?? 0) > 0,
      ).length,
    [data],
  );

  useEffect(() => {
    if (!data || firedRef.current || !sectionRef.current) return;
    const node = sectionRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !firedRef.current) {
            firedRef.current = true;
            analyticsEvents.track('streaks_section_viewed', {
              user_id: userId,
              featured_types: featured.map((f) => f.streak_type),
              active_count: activeCount,
              at_pb_count: featured.filter(
                (r) =>
                  r.is_active &&
                  (r.current_count ?? 0) === (r.best_count ?? 0) &&
                  (r.current_count ?? 0) > 0,
              ).length,
            });
            obs.disconnect();
          }
        });
      },
      { threshold: 0.5 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [data, featured, activeCount, userId]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth <= 0) return;
    const stride = childStride(el);
    if (stride <= 0) return;
    const newPage = Math.round(el.scrollLeft / stride);
    if (newPage !== page) setPage(newPage);
  }, [page]);

  const handlePagerChange = useCallback((n: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: childStride(el) * n, behavior: 'smooth' });
    setPage(n);
  }, []);

  const eyebrowText =
    activeCount > 0 ? `ON THE LINE · ${activeCount} ACTIVE` : 'ON THE LINE';

  if (isLoading) {
    return (
      <section style={{ marginTop: 32 }}>
        <DarkSectionHeader eyebrow={eyebrowText} />
        <div style={{ padding: '4px 20px 12px' }}>
          <Skeleton height={172} radius={16} />
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  const everyZero = data.every(
    (r) => (r.current_count ?? 0) === 0 && (r.best_count ?? 0) === 0,
  );
  if (everyZero) return null;

  if (featured.length === 0) return null;

  return (
    <section ref={sectionRef} style={{ marginTop: 32, fontFamily: FONT }}>
      <style>{`
        .gam-no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <DarkSectionHeader
        eyebrow={eyebrowText}
        right={
          readOnly ? null : (
            <button
              type="button"
              onClick={() => {
                analyticsEvents.track('all_streaks_open', { user_id: userId });
                openAllStreaks();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--hcp-t-60)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                padding: '4px 6px',
              }}
            >
              SEE ALL <ChevronRight size={12} strokeWidth={2.4} />
            </button>
          )
        }
      />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="gam-no-scrollbar"
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          scrollPaddingLeft: 16,
          WebkitOverflowScrolling: 'touch',
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 4,
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {featured.map((row) => {
          const entry = STREAK_CARD_CONFIG[row.streak_type];
          if (!entry) return null;
          return (
            <div
              key={row.streak_type}
              style={{
                flex: '0 0 88%',
                scrollSnapAlign: 'start',
                boxSizing: 'border-box',
              }}
            >
              <StreakHeroCard entry={entry} row={row} />
            </div>
          );
        })}
      </div>

      <DotPager total={featured.length} current={page} onChange={handlePagerChange} />
    </section>
  );
};

export default StreaksCard;
