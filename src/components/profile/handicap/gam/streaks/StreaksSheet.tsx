import React from 'react';
import { Snowflake } from 'lucide-react';
import SheetHeader from '@/components/ui/SheetHeader';
import { GamSheet } from '../_shared/GamSheet';
import { Skeleton, RetryStub } from '../_shared/GamAtoms';
import { useMyStreaks } from '@/hooks/gam/useMyStreaks';
import type { StreakRow, StreakType } from '@/lib/gam/types';
import { relativeTime } from '@/lib/gam/visuals';
import {
  STREAK_SHEET_CONFIG,
  STREAK_SHEET_ORDER,
} from './streakConfig';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const AMBER = '#F7931E';

interface StreaksSheetProps {
  open: boolean;
  onClose: () => void;
}

// ──────────────────────────────────────────────────────────────────
// Row
// ──────────────────────────────────────────────────────────────────

const StreakRowView: React.FC<{ type: StreakType; row: StreakRow | null }> = ({ type, row }) => {
  const meta = STREAK_SHEET_CONFIG[type];
  const current = row?.current_count ?? 0;
  const best = row?.best_count ?? 0;
  const isActive = !!row?.is_active && current > 0;
  const freeze = row?.freeze_credits ?? 0;

  // CRITICAL: only render "Started X ago" when the streak is currently active.
  // current_started_at persists after a streak breaks; gating prevents stale dates.
  const startedLine =
    isActive && row?.current_started_at
      ? `Started ${relativeTime(row.current_started_at)}`
      : !isActive && best > 0 && row?.best_ended_at
      ? `Last broken ${relativeTime(row.best_ended_at)}`
      : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '16px 16px',
        borderBottom: '0.5px solid var(--hcp-line)',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '34%',
          background: isActive ? 'rgba(247,147,30,0.14)' : 'var(--hcp-bg-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
          fontSize: 18,
        }}
      >
        <span aria-hidden>{meta.emoji}</span>
        {freeze > 0 && (
          <span
            aria-label="Freeze available"
            title="Freeze available — keeps streak alive if you miss a week"
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#DBEAFE',
              border: '2px solid var(--hcp-bg-0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Snowflake size={10} color="#1D4ED8" strokeWidth={3} />
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: 'var(--hcp-t-60)',
            }}
          >
            {meta.label}
          </div>
          <span
            style={{
              padding: '2px 7px',
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

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--hcp-t-100)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"kern" 1, "liga" 1',
            }}
          >
            {current}
          </span>
          <span style={{ fontSize: 12, color: 'var(--hcp-t-60)', fontWeight: 600 }}>
            {meta.unit}
          </span>
          {best > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--hcp-t-60)',
                letterSpacing: '0.04em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              PB · {best}
            </span>
          )}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: 'var(--hcp-t-60)',
            lineHeight: 1.4,
          }}
        >
          {meta.explainer}
        </div>

        {startedLine && (
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: 'var(--hcp-t-40)',
              fontWeight: 600,
            }}
          >
            {startedLine}
          </div>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────
// Sheet
// ──────────────────────────────────────────────────────────────────

export const StreaksSheet: React.FC<StreaksSheetProps> = ({ open, onClose }) => {
  const { data, isLoading, isError, refetch } = useMyStreaks(open);

  const byType = new Map<string, StreakRow>();
  (data ?? []).forEach((r) => byType.set(r.streak_type, r));

  const activeCount = (data ?? []).filter((r) => r.is_active && r.current_count > 0).length;
  const dormantCount = STREAK_SHEET_ORDER.length - activeCount;
  const totalFreezes = (data ?? []).reduce((acc, r) => acc + (r.freeze_credits ?? 0), 0);

  return (
    <GamSheet open={open} onClose={onClose}>
      <SheetHeader
        eyebrow="ALL STREAKS"
        title="Your streaks"
        sub={
          isLoading || isError
            ? undefined
            : `${activeCount} active · ${dormantCount} dormant${totalFreezes > 0 ? ` · ${totalFreezes} freezes` : ''}`
        }
        onClose={onClose}
        dark
      />
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', willChange: 'transform' }}>
        {isLoading && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STREAK_SHEET_ORDER.map((t) => (
              <Skeleton key={t} height={88} radius={12} />
            ))}
          </div>
        )}

        {isError && (
          <div style={{ padding: 16 }}>
            <RetryStub message="Couldn't load streaks" onRetry={() => refetch()} />
          </div>
        )}

        {!isLoading && !isError && totalFreezes > 0 && (
          <div
            style={{
              margin: '12px 16px',
              padding: 12,
              borderRadius: 12,
              background: 'rgba(29,78,216,0.12)',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              fontFamily: FONT,
            }}
          >
            <Snowflake size={18} color="#60A5FA" />
            <div style={{ fontSize: 12, color: 'var(--hcp-t-100)', lineHeight: 1.4 }}>
              <strong>
                {totalFreezes} Streak Freeze{totalFreezes === 1 ? '' : 's'} available
              </strong>{' '}
              · Auto-applied if you miss a week.
            </div>
          </div>
        )}

        {!isLoading && !isError &&
          STREAK_SHEET_ORDER.map((type) => (
            <StreakRowView key={type} type={type} row={byType.get(type) ?? null} />
          ))}
      </div>
    </GamSheet>
  );
};

export default StreaksSheet;
