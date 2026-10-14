/**
 * Admin Analytics: four lenses plus Live (BRIEF_ANALYTICS). Every figure comes
 * from the five get_admin_analytics_* RPCs; nothing here reads a table.
 * ?tab=events and ?tab=auth still open the URL-only diagnostics.
 */
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AnalyticsLenses from '../components/analytics/AnalyticsLenses';
import HealthLens from '../components/analytics/HealthLens';
import BehaviourLens from '../components/analytics/BehaviourLens';
import JourneysLens from '../components/analytics/JourneysLens';
import ScreensLens from '../components/analytics/ScreensLens';
import LiveLens from '../components/analytics/LiveLens';
import { diagnosticOf, isLens, lensOf, rangeOf, type Lens, type Range } from '../components/analytics/analyticsLens';
import { AuthTab, EventsTab } from './AnalyticsDiagnostics';
import type { AnalyticsPeriod } from '../hooks/useAnalytics';

const COLUMN: React.CSSProperties = {
  padding: '0 12px 24px', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 1280, margin: '0 auto',
  fontVariantNumeric: 'tabular-nums',
};

export default function AnalyticsPage() {
  const [params, setParams] = useSearchParams();
  const diag = diagnosticOf(params);
  const lens = lensOf(params);
  const range = rangeOf(params);

  // Legacy ?tab= / ?view= links are rewritten to ?lens= in place.
  useEffect(() => {
    if (diag) return;
    if (isLens(params.get('lens')) && !params.has('tab') && !params.has('view')) return;
    if (!params.has('tab') && !params.has('view')) return;
    const next = new URLSearchParams(params);
    next.delete('tab'); next.delete('view'); next.delete('period');
    next.set('lens', lens);
    setParams(next, { replace: true });
  }, [diag, lens, params, setParams]);

  if (diag) {
    const p = params.get('period');
    const period: AnalyticsPeriod = p === '7d' || p === '14d' || p === '90d' ? p : '30d';
    return (
      <div style={{ ...COLUMN, padding: '8px 16px 0', gap: 12 }}>
        {diag === 'events' ? <EventsTab period={period} /> : <AuthTab period={period} />}
      </div>
    );
  }

  const set = (fn: (n: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    fn(next);
    setParams(next, { replace: true });
  };
  const setLens = (l: Lens) => set((n) => n.set('lens', l));
  const setRange = (r: Range) => set((n) => n.set('range', r));
  const setStaff = (on: boolean) => set((n) => (on ? n.set('staff', '1') : n.delete('staff')));

  return (
    <div style={{ ...COLUMN, paddingTop: 10 }}>
      {lens !== 'live' && <AnalyticsLenses lens={lens} onLens={setLens} />}
      {lens === 'health' && <HealthLens range={range} onRange={setRange} />}
      {lens === 'behaviour' && <BehaviourLens />}
      {lens === 'journeys' && <JourneysLens />}
      {lens === 'screens' && <ScreensLens />}
      {lens === 'live' && <LiveLens staff={params.get('staff') === '1'} onStaff={setStaff} />}
    </div>
  );
}
