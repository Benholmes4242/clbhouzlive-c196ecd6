/**
 * TEMPORARY CB38 measurement harness — deletes after measurement.
 * Mounts the real RoundsGate in its real layout chain (main:has gate CSS from
 * roundsGate.css applies) with a 148px page-top stand-in, a 40px stuck chip
 * row, real Section head, 54px board rows (BOARD_ROW_METRICS padY 10 + avatar
 * 34) and a fixed nav stand-in (64px, bottom 20, sets --nav-pill-h).
 */
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import enCourses from '../public/locales/en/courses.json';
import { RoundsGate } from './features/explore-magazine/RoundsGate';
import { Section } from './features/explore-magazine/Section';

const i18n = createInstance();
void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { courses: enCourses } },
  interpolation: { escapeValue: false },
});

function NavStandIn() {
  useEffect(() => {
    document.documentElement.style.setProperty('--nav-pill-h', '64px');
  }, []);
  return (
    <div
      data-nav-standin=""
      style={{ position: 'fixed', left: 12, right: 12, bottom: 20, height: 64, borderRadius: 999, background: '#0F172A', zIndex: 100 }}
    />
  );
}

function Row({ n }: { n: number }) {
  return (
    <div
      data-board-row=""
      style={{
        height: 54, boxSizing: 'border-box', display: 'flex', alignItems: 'center', color: '#F8FAFC',
        borderBottom: '0.5px solid rgba(248,250,252,0.10)', fontSize: 14.5, fontWeight: 700, fontFamily: 'sans-serif',
      }}
    >
      Round {n}
    </div>
  );
}

function App() {
  return (
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <main style={{ paddingTop: 148 }}>
          <div data-explore-magazine="">
            <div data-stuck="" style={{ height: 40, display: 'flex', alignItems: 'center', padding: '0 16px', fontFamily: 'sans-serif', fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
              Rounds
            </div>
            <div data-scores-board-container="">
              <RoundsGate roundCount={12} scope="everyone">
                <div>
                  <div style={{ height: 48, padding: '0 16px 12px', boxSizing: 'border-box' }}>
                    <div style={{ height: 36, borderRadius: 999, border: '1px solid rgba(248,250,252,0.14)' }} />
                  </div>
                  <Section contest={false} eyebrow="Just played" title="Latest rounds">
                    <div>
                      {[1, 2, 3, 4, 5, 6].map((n) => <Row key={n} n={n} />)}
                    </div>
                  </Section>
                </div>
              </RoundsGate>
            </div>
          </div>
        </main>
        <NavStandIn />
      </I18nextProvider>
    </MemoryRouter>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
