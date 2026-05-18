import React, { useEffect, useMemo, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { DarkSectionHeader } from '../../whs/sections/_shared/darkAtoms';
import { Skeleton } from '../_shared/GamAtoms';
import { useUserStreaks } from '@/hooks/gam/useUserStreaks';
import type { StreakRow } from '@/lib/gam/types';
import { STREAK_CARD_ORDER, type StreakCardEntry } from './streakConfig';
import { openAllStreaks } from '../../whs/gam/events';
import { analyticsEvents } from '@/utils/analyticsEvents';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const AMBER = '#F7931E';

interface Props {
  userId: string;
}

// ──────────────────────────────────────────────────────────────────
// Single streak tile
// ──────────────────────────────────────────────────────────────────

interface StreakTileProps {
  entry: StreakCardEntry;
  row: StreakRow | null | undefined;
}

const ActivityGrid: React.FC<{ days: number[] | null | undefined; caption: string }> = ({
  days,
  caption,
}) => {
  const slots = days && days.length === 7
    ? days
    : [0, 0, 0, 0, 0, 0, 0];
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 22 }}>
        {slots.map((count, i) => {
          const filled = count > 0;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: filled ? '100%' : '40%',
                background: filled ? AMBER : 'var(--hcp-line)',
                borderRadius: 2,
                opacity: filled ? Math.min(1, 0.55 + count * 0.2) : 1,
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: 'var(--hcp-t-40)',
          textTransform: 'uppercase',
        }}
      >
        {caption}
      </div>
    </div>
  );
};

const StreakTile: React.FC<StreakTileProps> = ({ entry, row }) => {
  const Icon = entry.icon;
  const current = row?.current_count ?? 0;
  const best = row?.best_count ?? 0;
  const isActive = !!row?.is_active && current > 0;
  const isPb = current > 0 && current === best;

  return (
    <div
      style={{
        flexShrink: 0,
        width: 244,
        background: 'var(--hcp-bg-1)',
        border: `1px solid ${isActive ? 'rgba(247,147,30,0.32)' : 'var(--hcp-line)'}`,
        borderRadius: 14,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: isActive ? 'rgba(247,147,30,0.14)' : 'var(--hcp-bg-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            size={16}
            color={isActive ? AMBER : 'var(--hcp-t-60)'}
            strokeWidth={2.2}
            fill={isActive && entry.type === 'counter' ? AMBER : 'none'}
          />
        </div>
        <span
          style={{
            padding: '3px 9px',
            borderRadius: 99,
            background: isActive ? AMBER : 'var(--hcp-bg-2)',
            color: isActive ? '#fff' : 'var(--hcp-t-60)',
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.10em',
          }}
        >
          {isActive ? 'ACTIVE' : 'DORMANT'}
        </span>
      </div>

      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.12em',
          color: 'var(--hcp-t-60)',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {entry.label}
      </div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--hcp-t-40)',
          fontWeight: 500,
          lineHeight: 1.35,
          marginBottom: 14,
          minHeight: 30,
        }}
      >
        {entry.description}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: 'var(--hcp-t-100)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"kern" 1, "liga" 1',
          }}
        >
          {current}
        </span>
        <span style={{ fontSize: 14, color: 'var(--hcp-t-60)', fontWeight: 600 }}>
          {entry.unit}
        </span>
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          fontWeight: 700,
          color: isPb ? AMBER : 'var(--hcp-t-60)',
          letterSpacing: '0.04em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {isPb ? 'NEW PB!' : best > 0 ? `PB · ${best}` : 'NO PB YET'}
      </div>

      {entry.showGrid && (
        <ActivityGrid
          days={row?.recent_activity_days ?? null}
          caption={entry.gridCaption ?? ''}
        />
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────
// Section
// ──────────────────────────────────────────────────────────────────

export const StreaksCard: React.FC<Props> = ({ userId }) => {
  const { data, isLoading } = useUserStreaks(userId);
  const sectionRef = useRef<HTMLElement | null>(null);
  const firedRef = useRef(false);

  const byType = useMemo(() => {
    const map = new Map<string, StreakRow>();
    (data ?? []).forEach((r) => map.set(r.streak_type, r));
    return map;
  }, [data]);

  useEffect(() => {
    if (!data || firedRef.current || !sectionRef.current) return;
    const node = sectionRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !firedRef.current) {
            firedRef.current = true;
            const counter = byType.get('counter');
            const cutting = byType.get('cutting');
            const sub80 = byType.get('sub_80');
            analyticsEvents.track('streaks_section_viewed', {
              user_id: userId,
              counter_current: counter?.current_count ?? 0,
              counter_active: !!counter?.is_active,
              cutting_current: cutting?.current_count ?? 0,
              sub_80_current: sub80?.current_count ?? 0,
            });
            obs.disconnect();
          }
        });
      },
      { threshold: 0.5 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [data, byType, userId]);

  if (isLoading) {
    return (
      <section style={{ marginTop: 10 }}>
        <DarkSectionHeader eyebrow="Three Runs to Beat" />
        <div style={{ padding: '4px 20px 12px' }}>
          <Skeleton height={224} radius={14} />
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  // Hide entirely if every featured card streak is 0 (best-and-current).
  const everyZero = STREAK_CARD_ORDER.every((e) => {
    const r = byType.get(e.type);
    return (r?.current_count ?? 0) === 0 && (r?.best_count ?? 0) === 0;
  });
  if (everyZero) return null;

  return (
    <section ref={sectionRef} style={{ marginTop: 10, fontFamily: FONT }}>
      <DarkSectionHeader
        eyebrow="Three Runs to Beat"
        right={
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
        }
      />

      <style>{`.gam-streaks-row::-webkit-scrollbar { display: none; }`}</style>
      <div
        className="gam-streaks-row"
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          padding: '4px 20px 12px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          willChange: 'transform',
        }}
      >
        {STREAK_CARD_ORDER.map((entry) => (
          <StreakTile key={entry.type} entry={entry} row={byType.get(entry.type) ?? null} />
        ))}
      </div>
    </section>
  );
};

export default StreaksCard;
