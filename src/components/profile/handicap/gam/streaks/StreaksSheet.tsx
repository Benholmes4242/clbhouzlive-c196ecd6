import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GamSheet } from '../_shared/GamSheet';
import { Skeleton, RetryStub } from '../_shared/GamAtoms';
import { useMyStreaks } from '@/hooks/gam/useMyStreaks';
import type { StreakRow, StreakType } from '@/lib/gam/types';
import { formatRelativeAgo } from '@/i18n/format';
import { CHART, CHART_FONT } from '../../whs/charts';
import { STREAK_SHEET_CONFIG, STREAK_SHEET_ORDER } from './streakConfig';

const relativeTime = (iso: string | null) => formatRelativeAgo(iso, { yesterday: true });

/**
 * Dark literals from charts/tokens - this sheet portals outside `.hcp-dark`
 * so `var(--hcp-*)` does not resolve here.
 */
const FONT = CHART_FONT;

const LABEL: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 9.5,
  fontWeight: 800,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: CHART.DIM,
};

const TABULAR: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  fontFeatureSettings: '"kern" 1, "liga" 1',
};

const BAR_HEIGHT = 4;

const Bar: React.FC<{ pct: number; color: string }> = ({ pct, color }) => (
  <div
    style={{
      height: BAR_HEIGHT,
      borderRadius: BAR_HEIGHT / 2,
      background: 'rgba(255,255,255,0.16)',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        width: `${Math.max(0, Math.min(100, pct))}%`,
        height: '100%',
        background: color,
      }}
    />
  </div>
);

interface StreaksSheetProps {
  open: boolean;
  onClose: () => void;
}

/** Derived from the counts, not from `is_active`: that flag cannot tell a
 * lapsed streak (a record exists) from one never started. */
type StreakState = 'active' | 'lapsed' | 'new';

function deriveState(row: StreakRow | null): StreakState {
  const current = row?.current_count ?? 0;
  const best = row?.best_count ?? 0;
  if (current > 0) return 'active';
  if (best > 0) return 'lapsed';
  return 'new';
}

const SectionHeader: React.FC<{ label: string; count: number }> = ({ label, count }) => (
  <div style={{ ...LABEL, padding: '20px 16px 8px', display: 'flex', gap: 6 }}>
    <span>{label}</span>
    <span style={{ ...TABULAR, color: CHART.MUTE }}>{count}</span>
  </div>
);

const CollapsedSection: React.FC<{
  label: string;
  count: number;
  children: React.ReactNode;
}> = ({ label, count, children }) => {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderTop: `1px solid ${CHART.BORDER}`,
          padding: '18px 16px 14px',
          cursor: 'pointer',
          ...LABEL,
        }}
      >
        <span>{label}</span>
        <span style={{ ...TABULAR, color: CHART.MUTE }}>{count}</span>
        <ChevronDown
          size={13}
          color={CHART.DIM}
          style={{
            marginLeft: 'auto',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 140ms ease',
          }}
          aria-hidden
        />
      </button>
      {open && children}
    </div>
  );
};

const StreakRowView: React.FC<{
  type: StreakType;
  row: StreakRow | null;
  state: StreakState;
  last?: boolean;
}> = ({ type, row, state, last }) => {
  const { t } = useTranslation('handicap');
  const meta = STREAK_SHEET_CONFIG[type];
  const current = row?.current_count ?? 0;
  const best = row?.best_count ?? 0;
  const freeze = row?.freeze_credits ?? 0;
  const atBest = state === 'active' && best > 0 && current >= best;
  /**
   * `best_ended_at === null` means the record run has never ended - i.e. the
   * run on screen IS the best run and is still extending. That is a different
   * (and better) state than having matched an old record, so only the label
   * differs: both stay green and both fill the bar.
   */
  const settingItNow = atBest && row?.best_ended_at == null;
  const figureColour = state === 'active' ? (atBest ? CHART.DOWN : CHART.AMBER) : CHART.DIM;


  const unitLabel = (n: number) => t(`streaks.unit.${meta.unit}`, { count: n });

  return (
    <div
      style={{
        padding: '14px 16px',
        borderBottom: last ? 'none' : `1px solid ${CHART.BORDER}`,
        fontFamily: FONT,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: CHART.INK,
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
            }}
          >
            {t(`streaks.type.${type}.label`)}
          </div>
          <div style={{ marginTop: 3, fontSize: 11.5, fontWeight: 600, color: CHART.MUTE, lineHeight: 1.4 }}>
            {t(`streaks.type.${type}.explainer`)}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: figureColour,
              ...TABULAR,
            }}
          >
            {current}
          </div>
          <div style={{ ...LABEL, marginTop: 2 }}>{unitLabel(current)}</div>
        </div>
      </div>

      {/* A streak IS the relationship between now and the record, so the row
          shows it as progress rather than two unrelated figures. */}
      {state === 'active' && best > 0 && (
        <div style={{ marginTop: 10 }}>
          <Bar pct={(current / best) * 100} color={atBest ? CHART.DOWN : CHART.AMBER} />
          <div
            style={{
              marginTop: 6,
              fontSize: 11.5,
              fontWeight: 600,
              color: atBest ? CHART.DOWN : CHART.MUTE,
              ...TABULAR,
            }}
          >
            {atBest
              ? t('streaks.atYourBest')
              : t('streaks.fromYourBest', { n: best - current, best })}
          </div>
        </div>
      )}

      {state === 'lapsed' && (
        <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 600, color: CHART.MUTE, ...TABULAR }}>
          {row?.best_ended_at
            ? t('streaks.brokenLine', {
                n: best,
                unit: unitLabel(best),
                when: relativeTime(row.best_ended_at),
              })
            : t('streaks.bestLine', { n: best, unit: unitLabel(best) })}
        </div>
      )}

      {state === 'new' && (
        <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 600, color: CHART.DIM }}>
          {t('streaks.notStartedYet')}
        </div>
      )}

      {/* Freezes are a number, not a badge. They auto-apply on a missed week. */}
      {freeze > 0 && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ ...LABEL, color: CHART.MUTE }}>
            {t('streaks.freezeHeld', { count: freeze })}
          </span>
          {row?.freeze_refill_at && (
            <span style={{ ...LABEL }}>
              {t('streaks.freezeRefill', {
                when: relativeTime(row.freeze_refill_at),
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const StreaksSheet: React.FC<StreaksSheetProps> = ({ open, onClose }) => {
  const { t } = useTranslation('handicap');
  const { data, isLoading, isError, refetch } = useMyStreaks(open);

  const byType = useMemo(() => {
    const m = new Map<StreakType, StreakRow>();
    (data ?? []).forEach((r) => m.set(r.streak_type, r));
    return m;
  }, [data]);

  const { active, lapsed, fresh } = useMemo(() => {
    const a: StreakType[] = [];
    const l: StreakType[] = [];
    const f: StreakType[] = [];
    STREAK_SHEET_ORDER.forEach((type) => {
      const row = byType.get(type) ?? null;
      const state = deriveState(row);
      if (state === 'active') a.push(type);
      else if (state === 'lapsed') l.push(type);
      else f.push(type);
    });
    return { active: a, lapsed: l, fresh: f };
  }, [byType]);


  const longest = useMemo(() => {
    let bestRow: StreakRow | null = null;
    (data ?? []).forEach((r) => {
      if ((r.best_count ?? 0) > (bestRow?.best_count ?? 0)) bestRow = r;
    });
    return bestRow as StreakRow | null;
  }, [data]);

  const headline =
    active.length === 0
      ? t('streaks.headlineNone')
      : active.length === 1
        ? t('streaks.headlineOne')
        : t('streaks.headlineMany', { count: active.length });

  const subLineParts: string[] = [];
  if (longest && (longest.best_count ?? 0) > 0) {
    subLineParts.push(
      t('streaks.longestEver', {
        n: longest.best_count,
        unit: t(`streaks.unit.${STREAK_SHEET_CONFIG[longest.streak_type].unit}`, {
          count: longest.best_count,
        }),
        name: t(`streaks.type.${longest.streak_type}.short`),
      }),
    );
  }
  // Freezes are deliberately NOT totalled here: they are seeded only for
  // round_played, so a header total reads as a pool covering every streak.


  return (
    <GamSheet open={open} onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, flexShrink: 0 }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.10)' }} />
      </div>

      <div
        style={{
          padding: '14px 16px 12px',
          borderBottom: `1px solid ${CHART.BORDER}`,
          flexShrink: 0,
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: CHART.AMBER,
          }}
        >
          {t('streaks.kicker')}
        </div>
        <h2
          id="streaks-sheet-title"
          style={{
            margin: '6px 0 0',
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: CHART.INK,
            ...TABULAR,
          }}
        >
          {isLoading || isError ? '\u00a0' : headline}
        </h2>
        {!isLoading && !isError && subLineParts.length > 0 && (
          <div style={{ ...LABEL, marginTop: 6, ...TABULAR, color: CHART.MUTE }}>
            {subLineParts.join(' \u00b7 ')}
          </div>
        )}
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
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STREAK_SHEET_ORDER.map((type) => (
              <Skeleton key={type} height={72} radius={12} />
            ))}
          </div>
        )}

        {isError && (
          <div style={{ padding: 16 }}>
            <RetryStub message="Couldn't load streaks" onRetry={() => refetch()} />
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {active.length > 0 && (
              <>
                <SectionHeader label={t('streaks.sectionRunning')} count={active.length} />
                {active.map((type, i) => (
                  <StreakRowView
                    key={type}
                    type={type}
                    row={byType.get(type) ?? null}
                    state="active"
                    last={i === active.length - 1}
                  />
                ))}
              </>
            )}

            <CollapsedSection label={t('streaks.sectionBroken')} count={lapsed.length}>
              {lapsed.map((type, i) => (
                <StreakRowView
                  key={type}
                  type={type}
                  row={byType.get(type) ?? null}
                  state="lapsed"
                  last={i === lapsed.length - 1}
                />
              ))}
            </CollapsedSection>

            <CollapsedSection label={t('streaks.sectionNotStarted')} count={fresh.length}>
              {fresh.map((type, i) => (
                <StreakRowView
                  key={type}
                  type={type}
                  row={byType.get(type) ?? null}
                  state="new"
                  last={i === fresh.length - 1}
                />
              ))}
            </CollapsedSection>

            {/* Streaks are the one mechanic here that punishes not playing.
                A member who just lost a run needs to know the record survives. */}
            <div
              style={{
                padding: '20px 16px 28px',
                borderTop: `1px solid ${CHART.BORDER}`,
                fontSize: 12.5,
                lineHeight: 1.5,
                color: CHART.MUTE,
              }}
            >
              {t('streaks.closing')}
            </div>
          </>
        )}
      </div>
    </GamSheet>
  );
};

export default StreaksSheet;
