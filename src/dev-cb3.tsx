/* TEMPORARY CB3 measurement harness — deleted after the Chromium measurement. */
import '@/index.css';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import en from '../public/locales/en/courses.json';
import { supabase } from '@/integrations/supabase/client';
import { CompetitionBoards } from '@/components/explore-tab-new/courseled/CompetitionBoards';

const mk = (course_id: string, course_name: string, comp_date: string, members: number, rows: number) =>
  Array.from({ length: rows }, (_, i) => ({
    comp_date, course_id, course_name, rounds: members, members,
    pos: i + 1, is_tie: false, user_id: `${course_id}-u${i}`, display_name: `Player ${i + 1}`,
    whs_score_id: `${course_id}-s${i}`, net_score: 68 + i, gross_score: 77 + i, course_par: 72,
  }));

const FIXTURE = [
  ...mk('west', 'Sundridge Park Golf Club (West Course)', '2026-10-11', 8, 8),
  ...mk('east', 'West', '2026-10-04', 5, 5),
  ...mk('north', 'East', '2026-09-26', 3, 3),
];

(supabase as unknown as { rpc: unknown }).rpc = async () => ({ data: FIXTURE, error: null });

const i18n = createInstance();
await i18n.init({ lng: 'en', fallbackLng: 'en', ns: ['courses'], defaultNS: 'courses', resources: { en: { courses: en } }, interpolation: { escapeValue: false } });

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={client}>
    <I18nextProvider i18n={i18n}>
      <CompetitionBoards viewerId="v" scope={'everyone' as never} enabled />
    </I18nextProvider>
  </QueryClientProvider>,
);
