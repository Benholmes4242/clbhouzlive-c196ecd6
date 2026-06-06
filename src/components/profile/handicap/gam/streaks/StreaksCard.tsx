import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Flame } from 'lucide-react';
import { DarkSectionHeader } from '../../whs/sections/_shared/darkAtoms';
import { Skeleton } from '../_shared/GamAtoms';
import { useUserStreaks } from '@/hooks/gam/useUserStreaks';
import type { StreakRow } from '@/lib/gam/types';
import { STREAK_CARD_CONFIG, type StreakCardEntry } from './streakConfig';
import { selectFeaturedStreaks } from './selectFeaturedStreaks';
import { milestoneFor } from './streakMilestones';
import { openAllStreaks } from '../../whs/gam/events';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { relativeTime } from '@/lib/gam/visuals';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const AMBER = '#F7931E';
const GOLD = '#FBBC2E';

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
  cardSweep: string;
  cardBorder: string;
  topStripe: string | null;
  outerGlow: string | null;
  iconBg: string;
  iconRing: string;
  iconOpacity: number;
  iconFilter: string | null;
  chipBg: string;
  chipBorder: string;
  chipColor: string;
  chipPulse: boolean;
  chipLabel: string;
  heroNumColor: string;
  heroNumShadow: string | null;
  progressFill: string;
  hintColor: string;
  hintFontWeight: number;
}

const STREAK_STATE_TOKENS: Record<StreakState, StreakStateToken> = {
  atpb: {
    cardSweep: 'var(--hcp-bg-1)',
    cardBorder: 'var(--hcp-line)',
    topStripe: null,
    outerGlow: null,
    iconBg: 'rgba(247,147,30,0.22)',
    iconRing: 'rgba(247,147,30,0.65)',
    iconOpacity: 1,
    iconFilter: null,
    chipBg: 'rgba(247,147,30,0.20)',
    chipBorder: AMBER,
    chipColor: GOLD,
    chipPulse: true,
    chipLabel: 'AT YOUR PB',
    heroNumColor: GOLD,
    heroNumShadow: '0 0 12px rgba(247,147,30,0.45)',
    progressFill: `linear-gradient(90deg, ${AMBER} 0%, ${GOLD} 100%)`,
    hintColor: GOLD,
    hintFontWeight: 700,
  },
  active: {
    cardSweep: `linear-gradient(135deg, var(--hcp-bg-1) 0%, var(--hcp-bg-2) 50%, rgba(247,147,30,0.14) 100%)`,
    cardBorder: 'rgba(247,147,30,0.32)',
    topStripe: null,
    outerGlow: null,
    iconBg: 'rgba(247,147,30,0.14)',
    iconRing: 'rgba(247,147,30,0.42)',
    iconOpacity: 1,
    iconFilter: null,
    chipBg: 'rgba(247,147,30,0.16)',
    chipBorder: 'rgba(247,147,30,0.40)',
    chipColor: GOLD,
    chipPulse: true,
    chipLabel: 'ACTIVE',
    heroNumColor: GOLD,
    heroNumShadow: null,
    progressFill: `linear-gradient(90deg, ${AMBER}, ${GOLD})`,
    hintColor: 'var(--hcp-t-60)',
    hintFontWeight: 600,
  },
  dormant: {
    cardSweep: `linear-gradient(135deg, var(--hcp-bg-1) 0%, var(--hcp-bg-2) 50%, rgba(148,163,184,0.08) 100%)`,
    cardBorder: 'rgba(148,163,184,0.22)',
    topStripe: null,
    outerGlow: null,
    iconBg: 'rgba(148,163,184,0.10)',
    iconRing: 'rgba(148,163,184,0.25)',
    iconOpacity: 0.7,
    iconFilter: 'grayscale(80%)',
    chipBg: 'rgba(255,255,255,0.04)',
    chipBorder: 'rgba(255,255,255,0.08)',
    chipColor: 'var(--hcp-t-40)',
    chipPulse: false,
    chipLabel: 'DORMANT',
    heroNumColor: 'var(--hcp-t-40)',
    heroNumShadow: null,
    progressFill: 'rgba(148,163,184,0.30)',
    hintColor: 'var(--hcp-t-60)',
    hintFontWeight: 600,
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
            background: i === current ? '#FFFFFF' : 'rgba(255, 255, 255, 0.25)',
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

  const hintCopy: React.ReactNode =
    state === 'atpb'
      ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Flame size={13} strokeWidth={2} />
          At your personal best
        </span>
      )
      : state === 'active'
        ? best > 0
          ? `PB · ${best}`
          : 'First streak — keep going'
        : best > 0
          ? `Beat your record of ${best}`
          : `${entry.actionVerb} to start`;

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
        margin: '0 16px',
        padding: '18px 18px 16px',
        borderRadius: 16,
        overflow: 'hidden',
        minHeight: 230,
        display: 'flex',
        flexDirection: 'column',
        background: tokens.cardSweep,
        border: `1px solid ${tokens.cardBorder}`,
        boxShadow: tokens.outerGlow ?? undefined,
        fontFamily: FONT,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {tokens.topStripe && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: tokens.topStripe,
          }}
        />
      )}

      {/* Watermark */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -10,
          bottom: 8,
          opacity: 0.06,
          transform: 'rotate(-12deg)',
          pointerEvents: 'none',
          color: 'var(--hcp-t-100)',
        }}
      >
        <entry.Icon size={180} strokeWidth={1.4} />
      </div>

      {/* Chip */}
      <div
        style={{
          alignSelf: 'flex-start',
          padding: '4px 8px',
          borderRadius: 999,
          background: tokens.chipBg,
          border: `1px solid ${tokens.chipBorder}`,
          marginBottom: 14,
          position: 'relative',
          zIndex: 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {tokens.chipPulse && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: AMBER,
              animation: 'streakChipPulse 1.6s ease-in-out infinite',
            }}
          />
        )}
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: tokens.chipColor,
            textTransform: 'uppercase',
          }}
        >
          {tokens.chipLabel}
        </span>
      </div>

      {/* Icon + title + description */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: tokens.iconBg,
            border: `1px solid ${tokens.iconRing}`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 1,
            opacity: tokens.iconOpacity,
            filter: tokens.iconFilter ?? 'none',
            color: GOLD,
          }}
        >
          <entry.Icon size={28} strokeWidth={2} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--hcp-t-100)',
              lineHeight: 1.15,
              marginBottom: 3,
            }}
          >
            {entry.label}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--hcp-t-60)',
              lineHeight: 1.35,
            }}
          >
            {entry.description}
          </div>
        </div>
      </div>

      {/* Hero number */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 5,
          position: 'relative',
          zIndex: 1,
          marginTop: 'auto',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: tokens.heroNumColor,
            textShadow: tokens.heroNumShadow ?? 'none',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"kern" 1, "liga" 1',
          }}
        >
          {current}
        </span>
        <span style={{ fontSize: 13, color: 'var(--hcp-t-60)', fontWeight: 600 }}>
          {entry.unit}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            height: 4,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 999,
            overflow: 'hidden',
            marginBottom: 6,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              background: tokens.progressFill,
              transition: 'width 280ms ease',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--hcp-t-60)',
            letterSpacing: '0.04em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>{progressLeft}</span>
          <span style={{ color: 'var(--hcp-t-40)' }}>{progressRight}</span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: tokens.hintColor,
            fontWeight: tokens.hintFontWeight,
          }}
        >
          {hintCopy}
        </span>
        {meta && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--hcp-t-40)',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            {meta}
          </span>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────
// Section
// ──────────────────────────────────────────────────────────────────

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
    const childWidth = el.firstElementChild?.clientWidth ?? el.clientWidth;
    if (childWidth <= 0) return;
    const newPage = Math.round(el.scrollLeft / childWidth);
    if (newPage !== page) setPage(newPage);
  }, [page]);

  const handlePagerChange = useCallback((n: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const childWidth = el.firstElementChild?.clientWidth ?? el.clientWidth;
    el.scrollTo({ left: childWidth * n, behavior: 'smooth' });
    setPage(n);
  }, []);

  const eyebrowText =
    activeCount > 0 ? `ON THE LINE · ${activeCount} ACTIVE` : 'ON THE LINE';

  if (isLoading) {
    return (
      <section style={{ marginTop: 32 }}>
        <DarkSectionHeader eyebrow={eyebrowText} />
        <div style={{ padding: '4px 20px 12px' }}>
          <Skeleton height={230} radius={16} />
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
        @keyframes streakChipPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
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
                fontWeight: 800,
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
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
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
