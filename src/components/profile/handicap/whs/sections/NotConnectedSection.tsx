/**
 * SECTION K2 — THE NOT-CONNECTED STATE, FOR THE WHOLE PAGE.
 *
 * A member with no WHS connection sees THIS AND NOTHING ELSE: no kickers, no
 * hairlines, no withheld sections. Of roughly 100 accounts, 22 have a
 * connected handicap, so this is the majority page.
 *
 * Both buttons go to destinations that already exist:
 *   "Connect handicap" -> /manage/handicap, the existing connect flow
 *   "What's shared"    -> /privacy, the existing privacy document
 * Nothing new is built here — no flow, no sheet, no route.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { CHART, CHART_FONT } from '../charts';

export const NotConnectedSection: React.FC = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  React.useEffect(() => {
    analyticsEvents.track('handicap_not_connected_viewed', { surface: 'handicap_page' });
  }, []);

  return (
    <section style={{ fontFamily: CHART_FONT, padding: '32px 20px 0' }}>
      <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: CHART.INK }}>
        {t('handicap.notConnected.heading')}
      </h1>
      <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.55, color: CHART.MUTE }}>
        {t('handicap.notConnected.body')}
      </p>
      <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => {
            analyticsEvents.track('handicap_not_connected_cta', { action: 'connect' });
            navigate('/manage/handicap');
          }}
          style={{
            border: 0,
            borderRadius: 999,
            padding: '11px 18px',
            background: CHART.AMBER,
            color: '#0F172A',
            fontFamily: CHART_FONT,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {t('handicap.notConnected.connect')}
        </button>
        <button
          type="button"
          onClick={() => {
            analyticsEvents.track('handicap_not_connected_cta', { action: 'whats_shared' });
            navigate('/privacy');
          }}
          style={{
            border: `1px solid ${CHART.BORDER}`,
            borderRadius: 999,
            padding: '11px 18px',
            background: 'transparent',
            color: CHART.MUTE,
            fontFamily: CHART_FONT,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {t('handicap.notConnected.whatsShared')}
        </button>
      </div>
    </section>
  );
};

export default NotConnectedSection;
