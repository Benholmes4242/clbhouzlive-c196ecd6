/**
 * RoundsArchiveSheet - the full posted history, at 75dvh.
 *
 * The Rounds tab is gone; its list lives here, opened from RoundsArchivePanel
 * on Form. RecentRoundsCard is rendered in `variant="sheet"` so its filter
 * chips and month groups move across UNCHANGED - only the section header and
 * the outer margin are suppressed.
 *
 * className="hcp-dark" is LOAD-BEARING, not decoration: BottomSheet portals to
 * document.body, outside the .hcp-dark scope, and RecentRoundsCard's palette is
 * entirely var(--hcp-*) - without the class those tokens resolve to nothing and
 * the list renders invisible.
 *
 * Pinned header, one scroller beneath it.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import RecentRoundsCard from './RecentRoundsCard';
import { CHART, CHART_FONT, LABEL_STYLE } from '../../charts';

interface Props {
  open: boolean;
  onClose: () => void;
  connectionId: string;
  /** Profile owner - threaded through to the round detail scorecard. */
  userId?: string | null;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
  /** Rounds count for the header aside. */
  total?: number | null;
}

export const RoundsArchiveSheet: React.FC<Props> = ({
  open,
  onClose,
  connectionId,
  userId = null,
  viewMode = 'owner',
  ownerFirstName = null,
  total = null,
}) => {
  const { t } = useTranslation('common');
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="rounds-archive-sheet-title"
      variant="dark"
      surfaceColor={CHART.CANVAS}
      className="hcp-dark"

      style={{
        height: '75dvh',
        maxHeight: '75dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: CHART_FONT,
        background: CHART.CANVAS,
      }}
    >
      {/* Pinned header */}
      <div
        style={{
          flexShrink: 0,
          padding: '6px 16px 12px',
          borderBottom: `1px solid ${CHART.BORDER}`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          {/* Kicker names the thing; the TITLE is the count. */}
          <div style={{ ...LABEL_STYLE, color: CHART.MUTE }}>
            {viewMode === 'friend'
              ? ownerFirstName
                ? t('handicap.form.archive.postedHistoryOwned', { name: ownerFirstName })
                : t('handicap.form.archive.postedHistoryOwnedUnknown')
              : t('handicap.form.archive.postedHistory')}
          </div>
          <div
            id="rounds-archive-sheet-title"
            style={{
              marginTop: 3,
              fontSize: 17,
              fontWeight: 700,
              color: CHART.INK,
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {total != null
              ? t('handicap.form.archive.roundsTitle', { count: total })
              : t('handicap.form.archive.rounds')}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={t('handicap.form.archive.close')}
          style={{
            border: 'none',
            background: 'transparent',
            color: CHART.MUTE,
            cursor: 'pointer',
            padding: 6,
            margin: -6,
            lineHeight: 0,
            flexShrink: 0,
          }}
        >
          <X size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Scroller */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 24,
        }}
      >
        <RecentRoundsCard
          connectionId={connectionId}
          userId={userId}
          viewMode={viewMode}
          ownerFirstName={ownerFirstName}
          variant="sheet"
        />
      </div>
    </BottomSheet>
  );
};

export default RoundsArchiveSheet;
