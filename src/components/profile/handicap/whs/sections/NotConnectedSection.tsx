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
    <section style={{ fontFamily: CHART_FONT, padding: '24px 20px 32px' }}>
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            background: CHART.INK,
            color: CHART.CANVAS,
            border: 0,
            borderRadius: 12,
            padding: 14,
            fontFamily: CHART_FONT,
            fontSize: 13.5,
            fontWeight: 800,
            letterSpacing: '0.02em',
            cursor: 'pointer',
          }}
        >
          {t('handicap.notConnected.connect')} <span aria-hidden>{'\u203A'}</span>
        </button>
      </div>
    </section>
  );
};

export default NotConnectedSection;
