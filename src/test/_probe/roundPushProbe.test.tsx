import React from 'react';
import { render, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { it, vi } from 'vitest';

const log: string[] = []; (globalThis as any).__probe = (m: string) => log.push(m);
const session = { user: null as null | { id: string }, loading: true };
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => session }));
vi.mock('@/perf/usePageReady', () => ({ usePageReady: () => {} }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
const chain: any = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: { user_id: 'owner-1' }, error: null }) };
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => chain } }));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({
  RoundDetailSheet: (p: any) => { log.push(`SHEET mounted presentation=${p.presentation} scoreId=${p.scoreId} owner=${p.profileUserId}`); return <div data-sheet />; },
  default: (p: any) => { log.push(`SHEET(default) mounted ${p.presentation}`); return <div data-sheet />; },
}));

function ActivityProbe() {
  const l = useLocation();
  log.push(`ACTIVITY useLocation pathname=${l.pathname} key=${l.key} state=${JSON.stringify(l.state)}`);
  return <div data-activity />;
}

let RoundPage: React.FC;
function AppRoutesReplica() {
  const location = useLocation();
  const state = location.state as any;
  const routesLocation = state?.backgroundLocation || location;
  log.push(`APP bg=${!!state?.backgroundLocation} routesLocation.pathname=${routesLocation.pathname} real=${location.pathname} key=${location.key} overlayBlock=${!!state?.backgroundLocation}`);
  return (<>
    <Routes location={routesLocation}>
      <Route path="/round/:whsScoreId" element={<><Tag n="MAIN" /><RoundPage /></>} />
      <Route path="/notificationmessages" element={<ActivityProbe />} />
    </Routes>
    {state?.backgroundLocation && (
      <Routes>
        <Route path="/round/:whsScoreId" element={<><Tag n="OVERLAY" /><RoundPage /></>} />
      </Routes>
    )}
  </>);
}
function Tag({ n }: { n: string }) { log.push(`${n} round route matched`); return null; }

it('probe', async () => {
  const origWarn = console.log;
  RoundPage = (await import('@/pages/RoundPage')).default;
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const ui = render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/round/score-1']}><AppRoutesReplica /></MemoryRouter>
    </QueryClientProvider>,
  );
  log.push('--- auth settles signed-in ---');
  await act(async () => { session.user = { id: 'viewer' }; session.loading = false; ui.rerender(
    <QueryClientProvider client={qc}><MemoryRouter initialEntries={['/round/score-1']}><AppRoutesReplica /></MemoryRouter></QueryClientProvider>); });
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  log.push(`DOM sheet=${!!document.querySelector('[data-sheet]')} activity=${!!document.querySelector('[data-activity]')}`);
  origWarn(log.join('\n'));
});
