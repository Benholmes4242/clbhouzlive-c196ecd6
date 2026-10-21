import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '../public/locales/en/courses.json';
import '@/index.css';
import { RoundsGate } from '@/features/explore-magazine/RoundsGate';
import { A } from '@/features/courses/components/holes/analytical/tokens';

i18n.use(initReactI18next).init({ lng: 'en', resources: { en: { courses: en } }, interpolation: { escapeValue: false } });
const row = (i: number) => (
  <button key={i} data-board-row="" style={{ display: 'flex', width: '100%', padding: '9px 15px', border: 0, borderBottom: '1px solid rgba(255,255,255,.06)', background: 'none', color: A.INK, textAlign: 'left', gap: 10 }}>
    <span style={{ width: 30, height: 30, borderRadius: 9, background: '#2f4f6b' }} />
    <span style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>Member {i}</div><div style={{ marginTop: 3, fontSize: 11.5, color: A.BODY }}>Sample Golf Club · 2 under</div><div style={{ marginTop: 3, fontSize: 9, color: A.MUTE }}>18 OCT</div></span>
    <span style={{ fontSize: 14, fontWeight: 700 }}>7{i}</span>
  </button>
);
createRoot(document.getElementById('h')!).render(
  <MemoryRouter><I18nextProvider i18n={i18n}>
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', paddingBottom: 84, boxSizing: 'border-box', fontFamily: 'Geist, sans-serif' }}>
      <div data-fake-chrome style={{ flexShrink: 0, height: 148, borderBottom: '1px dashed #333', color: '#555', fontSize: 10, padding: 8 }}>app chrome + tabs + scope (synthetic, 148px)</div>
      <RoundsGate roundCount={62} scope="everyone">
        <div style={{ padding: '14px 15px 0', color: A.INK }}>
          <div style={{ fontSize: 11, color: A.AMBER, letterSpacing: '.16em', fontWeight: 700 }}>STANDOUT</div>
          <div style={{ marginTop: 5, fontSize: 18, fontWeight: 700 }}>Rounds of the fortnight</div>
        </div>
        {[1, 2, 3, 4, 5, 6].map(row)}
      </RoundsGate>
    </div>
    <div style={{ position: 'fixed', left: 12, right: 12, bottom: 20, height: 64, borderRadius: 20, background: '#1a1a1a', color: '#666', fontSize: 10, display: 'grid', placeItems: 'center' }}>nav pill (64px)</div>
  </I18nextProvider></MemoryRouter>,
);
