/**
 * SECTION K1 — THE FOOTER.
 *
 * A 1px hairline across the content width, then the provenance line:
 *   "Live WHS data - Member {n}"  10 / DIM
 *
 * The archive action is intentionally absent. Round history now lives on the
 * profile Rounds tab; this footer only identifies the live WHS source.
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
