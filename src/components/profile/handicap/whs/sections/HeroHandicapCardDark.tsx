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
          fontVariantNumeric: 'tabular-nums lining-nums',
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

type WindowKey = '30d' | '90d' | '12m';

const MS_PER_DAY = 86_400_000;
/** useHandicapTrend12mo's guard: 335 days of record before we claim 12 months. */
const MIN_12M_DAYS = 335;
/** Card colour — the halo under the graded stroke, never white. */
const CARD_BG = '#1B1E27';

const HeroHandicapCardDark: React.FC<Props> = ({ connection }) => {
  const { t } = useTranslation(['common']);
  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection.id);
  /* NO NEW QUERY: the full history is already loaded on this card by
     useHandicapTrend12mo. Every window is a slice of it. */
  const { data: history, isLoading: historyLoading } = useHandicapHistory(connection.id, 'all');

  const handicap = trend?.current ?? null;

  const slices = useMemo(() => {
    const rows = history ?? [];
    const now = Date.now();
    const since = (days: number) =>
      rows
        .filter((p) => now - new Date(p.observed_at).getTime() <= days * MS_PER_DAY)
        .map<IndexPoint>((p) => ({ t: p.observed_at, v: Number(p.handicap_index) }));
    const earliestTs = rows.length ? new Date(rows[0].observed_at).getTime() : now;
    return {
      '30d': since(30),
      '90d': since(90),
      '12m': since(365),
      has12m: rows.length > 0 && now - earliestTs >= MIN_12M_DAYS * MS_PER_DAY,
    };
  }, [history]);

  const [win, setWin] = React.useState<WindowKey>('90d');
  const active: WindowKey = win === '12m' && !slices.has12m ? '90d' : win;
  const chartPoints = slices[active];

  /* The two header deltas read their OWN windows regardless of the toggle,
     but from the SAME slices the chart draws, so they cannot drift. */
  const netOf = (pts: IndexPoint[]): number | null =>
    pts.length < 2 ? null : pts[pts.length - 1].v - pts[0].v;
  const delta90 = netOf(slices['90d']);
  const delta12 = slices.has12m ? netOf(slices['12m']) : null;

  const isLoading = trendLoading || historyLoading;

  const WINDOWS: { key: WindowKey; label: string }[] = [
    { key: '30d', label: '30D' },
    { key: '90d', label: '90D' },
    { key: '12m', label: '12M' },
  ];

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
                fontVariantNumeric: 'tabular-nums lining-nums',
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
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              {/* The pill is not the feature — the series is. */}
              <div style={{ display: 'flex', gap: 4 }}>
                {WINDOWS.map((w) => {
                  const disabled = w.key === '12m' && !slices.has12m;
                  const on = active === w.key;
                  return (
                    <button
                      key={w.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => setWin(w.key)}
                      style={{
                        border: 'none',
                        borderRadius: 999,
                        padding: '4px 9px',
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        background: on ? 'rgba(255,255,255,0.12)' : 'transparent',
                        color: disabled
                          ? 'rgba(255,255,255,0.20)'
                          : on
                            ? 'var(--hcp-t-100)'
                            : 'var(--hcp-t-40)',
                        opacity: disabled ? 0.6 : 1,
                      }}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--hcp-t-40)',
                }}
              >
                {t('common:handicap.hero.chartSample', { count: chartPoints.length })}
              </div>
            </div>
            <IndexChart
              points={chartPoints}
              height={124}
              hideFooter
              halo={CARD_BG}
              formatLabel={(iso) => formatDayMonthShortGB(iso)}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroHandicapCardDark;

