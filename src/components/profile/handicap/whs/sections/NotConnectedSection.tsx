/**
 * SECTION K2 — THE NOT-CONNECTED STATE, FOR THE WHOLE PAGE.
 *
 * A member with no WHS connection sees THIS AND NOTHING ELSE: no kickers, no
 * hairlines, no withheld sections. Of roughly 100 accounts, 22 have a
 * connected handicap, so this is the majority page.
 *
 * ONE call to action: "Connect handicap" -> /manage/handicap, the existing
 * connect flow. The "What's shared" button was removed: /privacy is the legal
 * document and does not answer what clbhouz reads from England Golf, so the
 * button promised an answer it could not deliver. A purpose-built explainer
 * is on the open list; when it exists, a second entry belongs here.
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
      <div style={{ marginTop: 20 }}>
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
      </div>
    </section>
  );
};

export default NotConnectedSection;
