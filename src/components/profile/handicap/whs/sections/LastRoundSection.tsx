/**
 * LastRoundSection — SECTION D of the one-page handicap brief.
 *
 * Flat replacement for LastRoundCard / LastRoundHeroCard: no photograph, no
 * scrim, no blur bed, no glass tray, no panel, no radius. Kicker, course
 * heading, date meta, three figures, one consequence line, one tap into the
 * existing RoundDetailSheet.
 *
 * NINE HOLES — ONE MARK ON THE ROW, NOT PER FIGURE.
 * The meta reads "{date} · 9 holes" on a nine-hole round and the date alone on
 * an eighteen. All three figures come from ONE round, so ONE caption governs
 * the row: no "GROSS (9)", no asterisk, no per-figure suffix. PLAYED TO leads
 * because WHS converts a nine-hole round to an eighteen-hole differential, so
 * it is the one figure that stays comparable; gross and stableford do not,
 * which is why the mark exists at all.
 *
 * Tones are the existing chart-token literals. No new tone is defined here.
 */
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { analyticsEvents } from '@/utils/analyticsEvents';
import { useLastRound } from '@/lib/whs/hooks';
import { formatWeekdayDayMonthShortGB } from '@/i18n/format';

import { HcpSection } from './HcpSection';
import RoundDetailSheet from './round-detail/RoundDetailSheet';
import { CHART } from '../charts';

const FIG: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  letterSpacing: '-0.04em',
};

const KICKER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.19em',
  textTransform: 'uppercase',
  color: CHART.DIM,
};

interface Props {
  connectionId: string;
  userId: string;
  /** 'owner' (default) shows first-person copy; 'friend' uses third person. */
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const LastRoundSection: React.FC<Props> = ({
  connectionId,
  userId,
  viewMode = 'owner',
  ownerFirstName = null,
}) => {
  const { t } = useTranslation(['common']);
  const { data: round, isLoading } = useLastRound(connectionId);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isLoading) return null;

  // Thin state: a sentence, never a disappearing section.
  if (!round) {
    return (
      <HcpSection hairline kicker={t('common:handicap.lastRound.eyebrow')}>
        <p style={{ margin: 0, fontSize: 12, color: CHART.DIM, lineHeight: 1.5 }}>
          {viewMode === 'friend'
            ? t('common:handicap.lastRound.emptyFriend', {
                name: ownerFirstName ?? t('common:handicap.lastRound.theyFallback'),
              })
            : t('common:handicap.lastRound.empty')}
        </p>
      </HcpSection>
    );
  }

  const courseName = round.course?.name ?? t('common:handicap.lastRound.unknownCourse');

  const dateLabel = round.play_date ? formatWeekdayDayMonthShortGB(round.play_date) : '';
  const isNine = round.is_nine_hole === true || round.total_holes === 9;
  const meta = isNine
    ? `${dateLabel} \u00b7 ${t('common:handicap.lastRound.nineHoles')}`
    : dateLabel;

  const diff = round.handicap_differential;
  const playedTo = diff == null ? null : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}`;
  const gross = round.adjusted_gross;
  const stableford = round.stableford_points;

  const delta = round.handicap_delta ?? null;
  const indexBefore = round.handicap_index_at_time ?? null;
  const indexAfter =
    indexBefore != null && delta != null
      ? Number((indexBefore + delta).toFixed(1))
      : indexBefore;
  const moved = delta != null && Math.abs(delta) >= 0.05;
  const rose = (delta ?? 0) > 0;

  const figures: Array<[string, string | null]> = [
    [t('common:handicap.lastRound.playedTo'), playedTo],
    [t('common:handicap.lastRound.gross'), gross != null ? String(gross) : null],
    [t('common:handicap.lastRound.stableford'), stableford != null ? String(stableford) : null],
  ];

  const open = () => {
    // NEW event. round_share_opened and round_post_tapped are different
    // actions; folding this into either would corrupt both series.
    analyticsEvents.track('handicap_last_round_opened', {
      score_id: round.id,
      is_nine_hole: isNine,
      total_holes: round.total_holes ?? null,
      view_mode: viewMode,
    });
    setSheetOpen(true);
  };

  return (
    <>
      <HcpSection hairline kicker={t('common:handicap.lastRound.eyebrow')} heading={courseName} meta={meta}>
        <button
          type="button"
          onClick={open}
          style={{
            display: 'block',
            width: '100%',
            padding: 0,
            margin: 0,
            border: 'none',
            borderRadius: 0,
            background: 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
            {figures.map(([label, value]) => (
              <div key={label} style={{ minWidth: 0 }}>
                <div style={{ ...KICKER, marginBottom: 6 }}>{label}</div>
                <div
                  style={{
                    height: 23,
                    display: 'flex',
                    alignItems: 'flex-end',
                    fontSize: 21,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: CHART.INK,
                    ...FIG,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
              marginTop: 18,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
              {indexAfter != null &&
                (moved && indexBefore != null ? (
                  <>
                    <span style={KICKER}>{t('common:handicap.lastRound.index')}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: CHART.MUTE, ...FIG }}>
                      {indexBefore.toFixed(1)}
                    </span>
                    <span aria-hidden style={{ ...KICKER, letterSpacing: 0 }}>
                      &rarr;
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: rose ? CHART.UP : CHART.DOWN,
                        ...FIG,
                      }}
                    >
                      {indexAfter.toFixed(1)}
                    </span>
                  </>
                ) : (
                  <>
                    <span style={KICKER}>{t('common:handicap.lastRound.indexHeldAt')}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: CHART.INK, ...FIG }}>
                      {indexAfter.toFixed(1)}
                    </span>
                  </>
                ))}
              {!round.is_counter && (
                <span style={KICKER}>
                  {'\u00b7'} {t('common:handicap.lastRound.notBest8')}
                </span>
              )}
            </span>
            <ChevronRight size={18} color={CHART.FAINT} strokeWidth={2.4} style={{ flexShrink: 0 }} />
          </div>
        </button>
      </HcpSection>

      <RoundDetailSheet
        scoreId={round.id}
        connectionId={connectionId}
        profileUserId={userId ?? null}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        handicapDelta={round.handicap_delta ?? null}
      />
    </>
  );
};

export default LastRoundSection;
