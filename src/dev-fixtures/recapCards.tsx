/* TEMPORARY verification fixture for the Season in review card list (card list A).
   Delete with fixture-recap.html after the 390/320 checks. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import '../index.css';
import '../styles/hybrid-hero.css';
import { SeasonRecapBody } from '../features/tourhub/components/overview-v3/SeasonRecapSections';
import type { SeasonRecapData } from '../features/tourhub/components/overview-v3/useSeasonRecap';

const i18n = i18next.createInstance();
const tourhub = await (await fetch('/locales/en/tourhub.json')).json();
i18n.use(initReactI18next).init({ lng: 'en', ns: ['tourhub'], defaultNS: 'tourhub', resources: { en: { tourhub } }, interpolation: { escapeValue: false } });

const KF_TOP20 = ['Ross Steelman', 'Sandy Scott', 'Ian Holt', 'Alistair Docherty', 'Alvaro Ortiz', 'Austin Hitt', 'Cole Sherwood', 'Doc Redman', 'Blades Brown', 'Tommy Morrison', 'Cooper Dossey', 'Hunter Eichhorn', 'Dylan Menante', 'Michael Johnson', 'Jeremy Gandon', 'Taylor Dickson', 'Ian Gilligan', 'Davis Shore', 'Carson Young', 'Davis Lamb'];

const data: SeasonRecapData = {
  events: 25, winners: 20, maxWins: 2, mostWinsSurname: 'Steelman', tiedLeaders: 1,
  standings: KF_TOP20.map((name, i) => ({ position: i + 1, name, points: 2221 - i * 40, playerId: `p${i}` })),
  standingsSource: { table: 'tour_season_rankings', date: '2026-10-12T00:00:00Z' },
  cardLine: { label: 'TOP 20 · PGA TOUR CARD FOR 2027', n: 20 },
  cardEarners: KF_TOP20.map((name, i) => {
    const [f, ...rest] = name.split(' ');
    return { name, age: name === 'Blades Brown' ? 19 : 27, playerId: `p${i}`, initialName: `${f[0]}. ${rest.join(' ')}` };
  }),
};

createRoot(document.getElementById('root')!).render(
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <div style={{ background: '#0A0A0C', minHeight: '100vh', padding: '16px 20px' }}>
          <SeasonRecapBody tour="pgad" year={2026} data={data} />
        </div>
      </MemoryRouter>
    </QueryClientProvider>
  </I18nextProvider>,
);
