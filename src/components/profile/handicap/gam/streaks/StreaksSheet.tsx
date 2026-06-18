import React, { useMemo } from 'react';
import { Snowflake, Flame } from 'lucide-react';
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
const GOLD = '#FBBC2E';

interface StreaksSheetProps {
  open: boolean;
  onClose: () => void;
}

type PbState = 'NEW_PB' | 'AT_PB' | 'NONE';

function derivePbState(row: StreakRow | null): PbState {
  if (!row) return 'NONE';
  const isActive = !!row.is_active && row.current_count > 0;
  if (!isActive) return 'NONE';
  if (row.current_count !== row.best_count) return 'NONE';
  if (row.current_count <= 1) return 'NONE';
  if (row.best_ended_at === null) return 'NEW_PB';
  return 'AT_PB';
}

const SectionHeader: React.FC<{
  label: string;
  count: number;
  amberDot?: boolean;
}> = ({ label, count, amberDot }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '20px 16px 10px',
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--hcp-t-80)',
      fontFamily: FONT,
    }}
  >
    {amberDot && <span style={{ color: AMBER }} aria-hidden>•</span>}
    <span>{label}</span>
    <span
      style={{
        color: 'var(--hcp-t-60)',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      ({count})
    </span>
  </div>
);

const PbTag: React.FC<{ state: PbState }> = ({ state }) => {
  if (state === 'NONE') return null;
  const isNew = state === 'NEW_PB';
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '3px 7px',
        borderRadius: 999,
        background: isNew
          ? 'linear-gradient(180deg, rgba(247,147,30,0.22), rgba(247,147,30,0.08))'
          : 'var(--hcp-bg-2)',
        border: isNew
          ? '1px solid rgba(247,147,30,0.42)'
          : '1px solid var(--hcp-line)',
        fontSize: 9,
        fontWeight: 800,
        color: isNew ? GOLD : 'var(--hcp-t-80)',
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        fontFamily: FONT,
      }}
      aria-label={isNew ? 'New personal best' : 'At personal best'}
    >
      {isNew && <Flame size={9} strokeWidth={2.4} aria-hidden />}
      {isNew ? 'NEW PB' : 'AT PB'}
    </div>
  );
};

const StreakRowView: React.FC<{ type: StreakType; row: StreakRow | null }> = ({
  type,
  row,
}) => {
  const meta = STREAK_SHEET_CONFIG[type];
  const Icon = meta.Icon;
  const current = row?.current_count ?? 0;
  const best = row?.best_count ?? 0;
  const isActive = !!row?.is_active && current > 0;
  const freeze = row?.freeze_credits ?? 0;
  const pbState = derivePbState(row);

  const metaLine =
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
        gap: 14,
        padding: '14px 16px',
        borderBottom: '0.5px solid var(--hcp-hairline)',
        fontFamily: FONT,
        background: isActive
          ? 'linear-gradient(90deg, rgba(247,147,30,0.06) 0%, rgba(247,147,30,0.01) 100%)'
          : 'transparent',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: isActive
            ? 'linear-gradient(180deg, rgba(247,147,30,0.18) 0%, rgba(247,147,30,0.06) 100%)'
            : 'linear-gradient(180deg, var(--hcp-bg-2), var(--hcp-bg-1))',
          border: isActive
            ? '1px solid rgba(247,147,30,0.32)'
            : '1px solid var(--hcp-line)',
          boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.30)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
          color: isActive ? GOLD : 'var(--hcp-t-80)',
        }}
      >
        <Icon size={17} strokeWidth={2.0} aria-hidden />
        {freeze > 0 && (
          <span
            aria-label="Freeze available"
            title="Freeze available — keeps streak alive if you miss a week"
            style={{
              position: 'absolute',
              top: -3,
              right: -3,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#DBEAFE',
              border: '2px solid var(--hcp-bg-0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Snowflake size={8} color="#1D4ED8" strokeWidth={3} />
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--hcp-t-100)',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
          }}
        >
          {meta.label}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: 'var(--hcp-t-60)',
            lineHeight: 1.4,
          }}
        >
          {meta.explainer}
        </div>
        {metaLine && (
          <div
            style={{
              marginTop: 6,
              fontSize: 10.5,
              color: 'var(--hcp-t-40)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {metaLine}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span
            style={{
              fontSize: 26,
              fontWeight: 200,
              color: isActive ? GOLD : 'var(--hcp-t-100)',
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {current}
          </span>
          <span
            style={{
              fontSize: 10,
              color: 'var(--hcp-t-60)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {meta.unit}
          </span>
        </div>
        {pbState !== 'NONE' ? (
          <PbTag state={pbState} />
        ) : best > 0 ? (
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--hcp-t-60)',
              letterSpacing: '0.10em',
              fontVariantNumeric: 'tabular-nums',
              textTransform: 'uppercase',
            }}
          >
            PB · {best}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const Eyebrow: React.FC = () => (
  <div
    style={{
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--hcp-t-100)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}
  >
    <span style={{ color: AMBER }} aria-hidden>•</span>
    STREAKS
  </div>
);

export const StreaksSheet: React.FC<StreaksSheetProps> = ({ open, onClose }) => {
  const { data, isLoading, isError, refetch } = useMyStreaks(open);

  const byType = useMemo(() => {
    const m = new Map<string, StreakRow>();
    (data ?? []).forEach((r) => m.set(r.streak_type, r));
    return m;
  }, [data]);

  const { activeTypes, dormantTypes } = useMemo(() => {
    const active: StreakType[] = [];
    const dormant: StreakType[] = [];
    STREAK_SHEET_ORDER.forEach((type) => {
      const row = byType.get(type);
      const isActive = !!row?.is_active && (row?.current_count ?? 0) > 0;
      (isActive ? active : dormant).push(type);
    });
    return { activeTypes: active, dormantTypes: dormant };
  }, [byType]);

  const totalFreezes = useMemo(
    () => (data ?? []).reduce((acc, r) => acc + (r.freeze_credits ?? 0), 0),
    [data],
  );

  return (
    <GamSheet open={open} onClose={onClose}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 8,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: 'var(--hcp-line-2, var(--hcp-line))',
          }}
        />
      </div>

      <div
        style={{
          padding: '12px 20px 10px',
          borderBottom: '0.5px solid var(--hcp-line)',
          flexShrink: 0,
          fontFamily: FONT,
        }}
      >
        <Eyebrow />
        <div
          style={{
            fontSize: 34,
            fontWeight: 200,
            letterSpacing: '-0.045em',
            color: 'var(--hcp-t-100)',
            marginTop: 4,
            lineHeight: 0.95,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {isLoading || isError ? '— active' : `${activeTypes.length} active`}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--hcp-t-60)',
            marginTop: 4,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {isLoading || isError
            ? ' '
            : `${activeTypes.length} active · ${dormantTypes.length} dormant${
                totalFreezes > 0
                  ? ` · ${totalFreezes} freeze${totalFreezes === 1 ? '' : 's'}`
                  : ''
              }`}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          willChange: 'transform',
          fontFamily: FONT,
        }}
      >
        {isLoading && (
          <div
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
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
              margin: '12px 16px 0',
              padding: 12,
              borderRadius: 12,
              background: 'rgba(29,78,216,0.12)',
              border: '1px solid rgba(96,165,250,0.18)',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              fontFamily: FONT,
            }}
          >
            <Snowflake size={16} color="#60A5FA" />
            <div style={{ fontSize: 12, color: 'var(--hcp-t-100)', lineHeight: 1.4 }}>
              <strong>
                {totalFreezes} Streak Freeze{totalFreezes === 1 ? '' : 's'} available
              </strong>{' '}
              — Auto-applied if you miss a week.
            </div>
          </div>
        )}

        {!isLoading && !isError && activeTypes.length > 0 && (
          <>
            <SectionHeader label="Active" count={activeTypes.length} amberDot />
            {activeTypes.map((type) => (
              <StreakRowView key={type} type={type} row={byType.get(type) ?? null} />
            ))}
          </>
        )}

        {!isLoading && !isError && dormantTypes.length > 0 && (
          <>
            <SectionHeader label="Dormant" count={dormantTypes.length} />
            {dormantTypes.map((type) => (
              <StreakRowView key={type} type={type} row={byType.get(type) ?? null} />
            ))}
          </>
        )}
      </div>
    </GamSheet>
  );
};

export default StreaksSheet;
