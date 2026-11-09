import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import tourhub from '../public/locales/en/tourhub.json';
import './index.css';
import './styles/hybrid-hero.css';
import { RecapPhotoBand, SeasonRecapBody } from '@/features/tourhub/components/overview-v3/SeasonRecapSections';

const i18n = i18next.createInstance();
i18n.use(initReactI18next).init({ lng: 'en', ns: ['tourhub'], defaultNS: 'tourhub', resources: { en: { tourhub } }, interpolation: { escapeValue: false } });
const top = [['Stewart Cink', 3943830], ['Zach Johnson', 3757828], ['Steven Alker', 2643207]] as const;
const data = {
  events: 28, winners: 19, maxWins: 6, mostWinsSurname: 'Johnson', tiedLeaders: 1,
  standings: top.map(([name, points], i) => ({ position: i + 1, name, points, playerId: null })),
  standingsSource: { table: 'tour_season_rankings', date: '2026-11-16T06:45:00Z' },
  cardLine: null, cardEarners: [],
} as never;
const slide = { type: 'completed', tournament: { id: 't1', tourSlug: 'champ', seasonYear: 2026, name: 'Charles Schwab Cup Championship presented by Something Long', status: 'closed', startDate: '2026-11-12', endDate: '2026-11-15', venueName: 'Phoenix Country Club', venueCity: 'Phoenix', venueState: 'AZ' } } as never;
const state = { kind: 'results', variant: 'final', finishDate: '2026-11-15', meta: '' } as never;
createRoot(document.getElementById('root')!).render(
  <I18nextProvider i18n={i18n}><QueryClientProvider client={new QueryClient()}><MemoryRouter>
    <RecapPhotoBand slide={slide} state={state} data={data} onOpen={() => {}} />
    <SeasonRecapBody tour="champ" year={2026} data={data} />
  </MemoryRouter></QueryClientProvider></I18nextProvider>);
