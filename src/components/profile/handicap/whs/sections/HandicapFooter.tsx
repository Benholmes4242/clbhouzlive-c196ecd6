/**
 * SECTION K1 — THE FOOTER.
 *
 * A 1px hairline across the content width, 12px, then one row:
 *   left   "All {n} rounds >"  11 / 700 / MUTE  -> the EXISTING RoundsArchiveSheet
 *   right  "Live WHS data - Member {n}"  10 / DIM
 *
 * The posted-history panel (RoundsArchivePanel) and the your-courses rail
 * (YourCoursesRail) come off the page here — dead-listed, not deleted. Their
 * three figures all survive elsewhere: the rounds total is this footer link,
 * the counters figure is Section E's meta, the 90-day count is Section F's.
 *
 * NO SECOND NAVIGATION: the trophy-room row stays at the foot of Personal
 * bests and is not repeated here.
 *
 * With no rounds the provenance line renders alone and there is no link.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAllScores } from '@/lib/whs/hooks';
import { analyticsEvents } from '@/utils/analyticsEvents';
import RoundsArchiveSheet from './trends/RoundsArchiveSheet';
import { CHART, CHART_FONT } from '../charts';

interface Props {
  connectionId: string;
  userId?: string | null;
  membershipNumber?: string | null;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

export const HandicapFooter: React.FC<Props> = ({
  connectionId,
  userId = null,
  membershipNumber = null,
  viewMode = 'owner',
  ownerFirstName = null,
}) => {
  const { t } = useTranslation('common');
  const [open, setOpen] = React.useState(false);
  const { data: allRounds } = useAllScores(connectionId);
  const total = allRounds?.length ?? 0;

  return (
    <>
      <section style={{ fontFamily: CHART_FONT, padding: '0 20px', marginTop: 34 }}>
        <div aria-hidden style={{ height: 1, background: CHART.BORDER }} />
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {total > 0 ? (
            <button
              type="button"
              onClick={() => {
                // Same event the panel fired, so the series is continuous.
                analyticsEvents.track('handicap_history_sheet_opened', { rounds: total });
                setOpen(true);
              }}
              style={{
                border: 0,
                padding: 0,
                background: 'transparent',
                color: CHART.MUTE,
                fontFamily: CHART_FONT,
                fontSize: 11,
                fontWeight: 700,
                textAlign: 'left',
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {t('handicap.footer.allRounds', { n: total })}
              {' \u203A'}
            </button>
          ) : (
            <span />
          )}
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: CHART.DIM,
              whiteSpace: 'nowrap',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {t('handicap.footer.provenance')}
            {membershipNumber
              ? ` \u00B7 ${t('handicap.footer.member', { n: membershipNumber })}`
              : ''}
          </span>
        </div>
      </section>

      {total > 0 && (
        <RoundsArchiveSheet
          open={open}
          onClose={() => setOpen(false)}
          connectionId={connectionId}
          userId={userId}
          viewMode={viewMode}
          ownerFirstName={ownerFirstName}
          total={total}
        />
      )}
    </>
  );
};

export default HandicapFooter;
