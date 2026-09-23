/**
 * SECTION K1 — THE FOOTER.
 *
 * A 1px hairline across the content width, then the provenance line:
 *   "Live WHS data - Member {n}"  10 / DIM
 *
 * The posted-history panel (RoundsArchivePanel) and the your-courses rail
 * (YourCoursesRail) come off the page here — deleted 10 Sep 2026. Their
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
import { CHART, CHART_FONT } from '../charts';

interface Props {
  membershipNumber?: string | null;
}

export const HandicapFooter: React.FC<Props> = ({
  membershipNumber = null,
}) => {
  const { t } = useTranslation('common');

  return (
      <section style={{ fontFamily: CHART_FONT, padding: '0 20px', marginTop: 34 }}>
        <div aria-hidden style={{ height: 1, background: CHART.BORDER }} />
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'flex-end',
          }}
        >
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
  );
};

export default HandicapFooter;
