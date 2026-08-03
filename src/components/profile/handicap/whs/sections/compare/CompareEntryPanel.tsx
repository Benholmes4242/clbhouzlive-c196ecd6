/**
 * CompareEntryPanel - the ONE way into the compare sheet from Circle.
 *
 * It stands where the Rivalries section used to sit. A panel, a line of copy
 * and a quiet Action - no slots to manage, no cards to fill, because the sheet
 * works against anyone the member can search.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { CHART, CHART_FONT, LABEL_STYLE } from '../../charts';
import { openCompare } from './events';

export const CompareEntryPanel: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <section style={{ marginTop: 32, fontFamily: CHART_FONT }}>
      <button
        type="button"
        onClick={() => openCompare('circle')}
        style={{
          margin: '0 16px',
          width: 'calc(100% - 32px)',
          background: CHART.PANEL,
          border: `1px solid ${CHART.BORDER}`,
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: CHART_FONT,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ ...LABEL_STYLE, color: CHART.MUTE }}>
            {t('handicap.compare.kicker')}
          </div>
          <div
            style={{
              marginTop: 5,
              fontSize: 15,
              fontWeight: 800,
              color: CHART.INK,
              letterSpacing: '-0.01em',
            }}
          >
            {t('handicap.compare.title')}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: CHART.MUTE,
              lineHeight: 1.45,
            }}
          >
            {t('handicap.compare.entryLine')}
          </div>
        </div>
        <ChevronRight
          size={16}
          strokeWidth={2.4}
          color={CHART.AMBER}
          style={{ flexShrink: 0 }}
        />
      </button>
    </section>
  );
};

export default CompareEntryPanel;
