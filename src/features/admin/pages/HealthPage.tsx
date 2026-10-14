/**
 * Admin Health: four lenses, Status / Golf data / App / Jobs (BRIEF_HEALTH).
 * Figures come from the get_admin_health_* RPCs and the existing service
 * hooks; nothing on this page reads a table. ?tab=settings and ?tab=video
 * keep their old pages (URL only); admins without manageAdmins only ever see
 * Settings here.
 */
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import AnalyticsLenses from '../components/analytics/AnalyticsLenses';
import StatusLens from '../components/health/StatusLens';
import GolfDataLens from '../components/health/GolfDataLens';
import AppLens from '../components/health/AppLens';
import JobsLens from '../components/health/JobsLens';
import { HEALTH_LENSES, canonicalHealthParams, healthViewOf, type HealthLens } from '../components/health/healthLens';
import SettingsTab from './SettingsTab';
import VideoPerfPage from './VideoPerfPage';

const COLUMN: React.CSSProperties = {
  padding: '10px 12px 24px', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 1280, margin: '0 auto',
  fontVariantNumeric: 'tabular-nums',
};

export default function HealthPage() {
  const { role } = usePanelRole();
  const can = panelCan(role);
  const [params, setParams] = useSearchParams();
  const view = healthViewOf(params, can.manageAdmins);

  useEffect(() => {
    const next = canonicalHealthParams(params, view);
    if (next) setParams(next, { replace: true });
  }, [params, view, setParams]);

  if (view.kind === 'settings') return <SettingsTab />;
  if (view.kind === 'video') return <VideoPerfPage />;

  const setLens = (l: HealthLens) => {
    const next = new URLSearchParams(params);
    next.delete('tab');
    next.set('lens', l);
    setParams(next, { replace: true });
  };

  return (
    <div style={COLUMN}>
      <AnalyticsLenses lens={view.lens} onLens={setLens} items={HEALTH_LENSES} label="Health lenses" />
      {view.lens === 'status' && <StatusLens />}
      {view.lens === 'golf' && <GolfDataLens />}
      {view.lens === 'app' && <AppLens />}
      {view.lens === 'jobs' && <JobsLens />}
    </div>
  );
}
