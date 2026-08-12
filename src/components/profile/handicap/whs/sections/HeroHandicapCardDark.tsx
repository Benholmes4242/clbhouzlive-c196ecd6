import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useHandicapTrend, useHandicapHistory } from '@/lib/whs/hooks';
import { useHandicapTrend12mo } from '@/hooks/useHandicapTrend12mo';
import type { WhsConnection } from '@/lib/whs/types';
import { Skeleton } from '@/components/ui/skeleton';
import { IndexChart, type IndexPoint } from '../charts';
import { formatDayMonthShortGB } from '@/i18n/format';

interface Props {
  connection: WhsConnection;
}

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function formatDelta(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  const sign = v < 0 ? '-' : '+';
  return `${sign}${Math.abs(v).toFixed(1)}`;
}

interface TrendRowProps {
  label: string;
  delta: number | null;
  borderTop?: boolean;
  caption: string;
}

function TrendRow({ label, delta, borderTop, caption }: TrendRowProps) {
  const improved = delta != null && delta < -0.05;
  const drifted = delta != null && delta > 0.05;
  const color = improved
    ? 'var(--hcp-good-2)'
    : drifted
      ? 'var(--hcp-bad)'
      : 'var(--hcp-t-40)';
  const arrow = improved ? '↓ ' : drifted ? '↑ ' : '';
  return (
    <div
      style={{
        padding: '10px 0 10px 16px',
        borderTop: borderTop ? '1px solid var(--hcp-line-2)' : 'none',
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--hcp-t-40)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color,
          fontVariantNumeric: 'tabular-nums lining',
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        {arrow}
        {formatDelta(delta)}
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--hcp-t-40)',
          fontWeight: 600,
          marginTop: 4,
        }}
      >
        {caption}
      </div>
    </div>
  );
}

const HeroHandicapCardDark: React.FC<Props> = ({ connection }) => {
  const { t } = useTranslation(['common']);
  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection.id);
  const { data: history90, isLoading: history90Loading } = useHandicapHistory(connection.id, 90);
  const trend12 = useHandicapTrend12mo(connection.id);

  const handicap = trend?.current ?? null;

  const delta90 = useMemo<number | null>(() => {
    if (!history90 || history90.length < 2) return null;
    return history90[history90.length - 1].handicap_index - history90[0].handicap_index;
  }, [history90]);

  const delta12 = trend12.delta;

  const isLoading = trendLoading || history90Loading;

  // 90-day index series. IndexChart owns the inversion via indexTone().
  const chartPoints = useMemo<IndexPoint[]>(() => {
    if (!history90) return [];
    return history90.map((p) => ({ t: p.observed_at, v: p.handicap_index }));
  }, [history90]);

  return (
    <section style={{ padding: '16px 16px 16px', fontFamily: FONT }}>
      <div
        style={{
          background: 'var(--hcp-bg-1)',
          border: '1px solid var(--hcp-line)',
          borderRadius: 16,
          padding: 16,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
        }}
      >
        {/* Left: CURRENT INDEX */}
        <div
          style={{
            borderRight: '1px solid var(--hcp-line-2)',
            paddingRight: 16,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--hcp-t-40)',
              marginBottom: 8,
            }}
          >
            Current Index
          </div>
          {isLoading ? (
            <Skeleton
              variant="dark"
              style={{ width: 96, height: 48, borderRadius: 8 }}
            />
          ) : (
            <div
              style={{
                fontSize: 56,
                fontWeight: 200,
                color: 'var(--hcp-t-100)',
                lineHeight: 0.9,
                letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums lining',
              }}
            >
              {handicap != null
                ? handicap < 0
                  ? `+${Math.abs(handicap).toFixed(1)}`
                  : handicap.toFixed(1)
                : '—'}
            </div>
          )}
        </div>

        {/* Right: 90 DAYS / 12 MONTHS stacked */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <TrendRow label="90 Days" delta={delta90} caption="over 90 days" />
          <TrendRow label="12 Months" delta={delta12} borderTop caption="over 12 months" />
        </div>

        {/* The shape, not just the number. Renders nothing under 2 points. */}
        {chartPoints.length >= 2 && (
          <div
            style={{
              gridColumn: '1 / -1',
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid var(--hcp-line-2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: 6,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--hcp-t-40)',
              }}
            >
              {t('common:handicap.hero.chartSample', { count: chartPoints.length })}
            </div>
            <IndexChart
              points={chartPoints}
              height={92}
              hideFooter
              formatLabel={(iso) => formatDayMonthShortGB(iso)}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroHandicapCardDark;
