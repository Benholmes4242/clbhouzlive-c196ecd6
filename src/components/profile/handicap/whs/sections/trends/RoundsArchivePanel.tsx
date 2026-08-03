/**
 * RoundsArchivePanel - the three-figure way into the posted history.
 *
 * Form absorbed the Rounds tab. This panel states the figures (ROUNDS,
 * COUNTERS, 90 DAYS) and opens RoundsArchiveSheet at 75dvh, which carries the
 * list, the filter chips and the month groups.
 *
 * Renders NOTHING when there are no rounds - the tab has other panels that
 * already say the history is empty.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { useAllScores, useHandicapTrend } from '@/lib/whs/hooks';
import { computeRoundDeltas } from './computeRoundDeltas';
import RoundsArchiveSheet from './RoundsArchiveSheet';
import { CHART, CHART_FONT, LABEL_STYLE } from '../../charts';
import { analyticsEvents } from '@/lib/analytics/events';

interface Props {
  connectionId: string;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const figureStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: '-0.02em',
  color: CHART.INK,
  fontVariantNumeric: 'tabular-nums lining-nums',
};

export const RoundsArchivePanel: React.FC<Props> = ({
  connectionId,
  viewMode = 'owner',
  ownerFirstName = null,
}) => {
  const { t } = useTranslation('common');
  const [open, setOpen] = React.useState(false);
  const { data: allRounds } = useAllScores(connectionId);
  const { data: trend } = useHandicapTrend(connectionId);

  const rounds = React.useMemo(
    () => (allRounds ? computeRoundDeltas(allRounds, trend?.current ?? null) : []),
    [allRounds, trend?.current],
  );

  if (rounds.length === 0) return null;

  const counters = rounds.filter((r) => r.is_counter).length;
  const cutoff = Date.now() - 90 * 86_400_000;
  const last90 = rounds.filter(
    (r) => r.play_date && new Date(r.play_date).getTime() >= cutoff,
  ).length;

  const figures = [
    { label: t('handicap.form.archive.rounds'), value: rounds.length },
    { label: t('handicap.form.archive.counters'), value: counters },
    { label: t('handicap.form.archive.last90Days'), value: last90 },
  ];

  return (
    <>
      <section style={{ marginTop: 32, fontFamily: CHART_FONT }}>
        <div
          style={{
            margin: '0 16px',
            background: CHART.PANEL,
            border: `1px solid ${CHART.BORDER}`,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span style={{ ...LABEL_STYLE, color: CHART.MUTE }}>
              {viewMode === 'friend'
                ? ownerFirstName
                  ? t('handicap.form.archive.postedHistoryOwned', { name: ownerFirstName })
                  : t('handicap.form.archive.postedHistoryOwnedUnknown')
                : t('handicap.form.archive.postedHistory')}
            </span>
            <button
              type="button"
              onClick={() => {
                // Fire-and-forget: never awaited in a render or handler path.
                analyticsEvents.track?.('handicap_history_sheet_opened', {
                  rounds: rounds.length,
                });
                setOpen(true);
              }}
              aria-label={t('handicap.form.archive.openFull')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                ...LABEL_STYLE,
                color: CHART.AMBER,
              }}
            >
              {t('handicap.form.archive.allRounds')}
              <ChevronRight size={13} strokeWidth={2.6} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 32, marginTop: 14 }}>
            {figures.map((f) => (
              <div key={f.label}>
                <div style={figureStyle}>{f.value}</div>
                <div style={{ ...LABEL_STYLE, marginTop: 6 }}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RoundsArchiveSheet
        open={open}
        onClose={() => setOpen(false)}
        connectionId={connectionId}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
        total={rounds.length}
      />
    </>
  );
};

export default RoundsArchivePanel;
