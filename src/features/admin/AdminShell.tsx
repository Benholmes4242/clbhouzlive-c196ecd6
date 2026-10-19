import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Menu, RefreshCw } from 'lucide-react';
import { usePanelRole } from '@/hooks/usePanelRole';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { panelCan } from '@/lib/panelCan';
import { adminTheme as t } from './theme';
import AdminDrawer from './AdminDrawer';
import AdminLoading from './components/AdminLoading';
import AdminAccessDenied from './components/AdminAccessDenied';
import { useAdminSettings } from './hooks/useAdminSettings';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { toast } from '@/lib/toast';
import { useAnalyticsLive } from './hooks/useAnalyticsLenses';
import { backFromLive, lensOf, toLive } from './components/analytics/analyticsLens';
import { londonHM, num } from './components/analytics/analyticsFormat';


const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const ContentPage = lazy(() => import('./pages/ContentPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const HealthPage = lazy(() => import('./pages/HealthPage'));
const InboxPage = lazy(() => import('./pages/InboxPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

const SECTION_TITLES: Record<string, string> = {
  dashboard:  'Command centre',
  inbox:      'Inbox',
  users:      'Members',
  content:    'Content',
  analytics:  'Analytics',
  health:     'Health',
  settings:   'Settings',
};


// Preserve ALL query params across redirects; optionally set/override ?type=
function RedirectPreserving({ to, forceType, forceTab }: { to: string; forceType?: string; forceTab?: string }) {
  const [params] = useSearchParams();
  const next = new URLSearchParams(params);
  if (forceType) next.set('type', forceType);
  if (forceTab && !next.get('tab')) next.set('tab', forceTab);
  const qs = next.toString();
  return <Navigate to={`${to}${qs ? `?${qs}` : ''}`} replace />;
}

export default function AdminShell() {
  const { role, loading } = usePanelRole();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  // Admin's notch is the header's surface, not the canvas, because the header touches it.
  // Icons stay light.
  // Route-scoped so keep-alive member pages can't repaint it on resume.
  useMedianStatusBar(
    'light',
    t.surface,
    false,
    false,
    true,
    location.pathname,
    (p) => p.startsWith('/admin-v2'),
  );

  /* BRIEF_ADMIN_SETTINGS_FIX1: hooks must run before the early returns, or the
     hook count grows when the role resolves and React throws. useAdminSettings
     already disables its query unless panelCan(role).manageAdmins, so calling
     it while role is 'none' or loading fetches nothing. */
  const settings = useAdminSettings(role);
  const maintenancePoll = useMaintenanceMode();

  if (loading) return <AdminLoading />;
  if (role === 'none' || role === 'unknown') return <AdminAccessDenied />;

  const can = panelCan(role);
  const segment = location.pathname.split('/')[2] ?? 'dashboard';
  const isAnalytics = segment === 'analytics' && can.manageAdmins;
  const onLive = isAnalytics && lensOf(params) === 'live' && !params.get('tab')?.match(/^(events|auth)$/);
  const title = onLive ? 'Live' : (SECTION_TITLES[segment] ?? 'Admin');

  /* BRIEF_ADMIN_SETTINGS S.6: while maintenance is on, a red bar sits under the
     header on every admin page. Full admins read the authoritative settings
     query and get the elapsed time and the Turn off button; other roles read
     the member-facing poll and get the bare bar. */
  const maintenanceOn = can.manageAdmins ? (settings.data?.maintenance.on ?? false) : maintenancePoll.on;

  // The dark app-shell has zero top padding (body.route-clubhouse), including admin.
  // Main pays the fixed header's full height; never pull this shell up by --sat:
  // that subtracts an inset the parent did not pay and hides the first content.
  // The maintenance bar's 48px is added while it is shown so content never slides under it.
  const headerHeight = `calc(${maintenanceOn ? 100 : 52}px + env(safe-area-inset-top, 0px))`;

  const defaultRoute = role === 'moderator' ? 'inbox?type=report' : 'dashboard';
  const canInbox = can.viewModeration || can.viewUsers || can.approveRequests;

  return (
    <div style={{ minHeight: '100dvh', background: t.canvas, color: t.ink, colorScheme: 'dark' }}>
      <AdminDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={role}
        canManageAdmins={can.manageAdmins}
      />

      <header
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          height: headerHeight,
          paddingTop: 'env(safe-area-inset-top, 0px)',
          background: t.surface,
          borderBottom: `1px solid ${t.line}`,
          display: 'flex', alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', width: '100%' }}>
          <button
            onClick={onLive ? () => setParams(backFromLive(params), { replace: true }) : () => setDrawerOpen(true)}
            aria-label={onLive ? 'Back to analytics' : 'Open navigation'}
            style={{
              width: 40, height: 40, borderRadius: t.radius.md,
              border: `1px solid ${t.line}`, background: t.surface,
              color: t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {onLive ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, marginLeft: 4 }}>
            <span style={{ color: t.inkFaint, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
              {onLive ? 'Analytics' : 'Admin'}
            </span>
            <span style={{ color: t.ink, fontSize: 15, fontWeight: 700 }}>{title}</span>
          </div>
          <div style={{ flex: 1 }} />
          {isAnalytics
            ? <AnalyticsHeaderSlot onLive={onLive} params={params} onOpenLive={() => setParams(toLive(params), { replace: true })} />
            : segment === 'settings'
              ? null
              : <RefreshHeaderButton />}
        </div>
      </header>

      {maintenanceOn ? (
        <MaintenanceBar
          changedAt={can.manageAdmins ? settings.data?.maintenance.changed_at ?? null : null}
          canManage={can.manageAdmins}
          onTurnOff={async () => {
            if (await settings.setConfig('maintenance_mode', 'off')) toast.success('Maintenance off');
          }}
        />
      ) : null}

      <main style={{
        paddingTop: headerHeight,
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
        minHeight: '100dvh',
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Suspense fallback={<AdminLoading />}>
              <Routes>
                <Route index element={<Navigate to={defaultRoute} replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="inbox/*" element={canInbox ? <InboxPage /> : <AdminAccessDenied />} />
                <Route path="users/*"     element={can.viewUsers ? <UsersPage /> : <AdminAccessDenied />} />
                <Route path="content/*"   element={<ContentPage />} />
                <Route path="analytics/*" element={can.manageAdmins ? <AnalyticsPage /> : <AdminAccessDenied />} />
                <Route path="health/*" element={<HealthPage />} />
                <Route path="settings/*" element={<SettingsPage />} />

                {/* Redirects: legacy health-family routes -> unified Health page */}
                <Route path="system/*"      element={<RedirectPreserving to="/admin-v2/health" />} />
                <Route path="echo-health/*" element={<RedirectPreserving to="/admin-v2/health" forceTab="status" />} />
                <Route path="push-health/*" element={<RedirectPreserving to="/admin-v2/health" forceTab="status" />} />
                <Route path="video-perf/*"  element={<RedirectPreserving to="/admin-v2/health" forceTab="video" />} />

                {/* Redirects: seven old queue routes -> unified inbox (preserving query params) */}
                <Route path="moderation/*"      element={<RedirectPreserving to="/admin-v2/inbox" forceType="report" />} />
                <Route path="appeals/*"         element={<RedirectPreserving to="/admin-v2/inbox" forceType="appeal" />} />
                <Route path="support/*"         element={<RedirectPreserving to="/admin-v2/inbox" forceType="support" />} />
                <Route path="verifications/*"   element={<RedirectPreserving to="/admin-v2/inbox" forceType="verification" />} />
                <Route path="approvals/*"       element={<RedirectPreserving to="/admin-v2/inbox" forceType="approval" />} />
                <Route path="match-requests/*"  element={<RedirectPreserving to="/admin-v2/inbox" forceType="match" />} />
                <Route path="course-matching/*" element={<RedirectPreserving to="/admin-v2/inbox/matching" />} />

                <Route path="*" element={<Navigate to={defaultRoute} replace />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/** S.6: the red maintenance bar. Elapsed ticks each minute from changed_at. */
function MaintenanceBar({ changedAt, canManage, onTurnOff }: {
  changedAt: string | null; canManage: boolean; onTurnOff: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  let elapsed = '';
  if (canManage && changedAt) {
    const mins = Math.max(0, Math.floor((now - new Date(changedAt).getTime()) / 60_000));
    elapsed = mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} min`;
  }
  return (
    <div
      role="status"
      style={{
        position: 'fixed', top: 'calc(52px + env(safe-area-inset-top, 0px))', left: 0, right: 0, zIndex: 49,
        height: 48, padding: '0 8px 0 16px', background: t.dangerSoft, borderBottom: `1px solid ${t.dangerSoft}`,
        display: 'grid', gridTemplateColumns: '8px minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.danger }} />
      <span style={{ fontSize: 13.5, fontWeight: 600, color: t.dangerText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        Maintenance on{elapsed ? ` · ${elapsed}` : ''} · members locked out
      </span>
      {canManage ? (
        <button
          type="button"
          onClick={onTurnOff}
          style={{
            height: 34, padding: '0 12px', borderRadius: 10, border: 0, background: t.danger, color: t.canvas,
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Turn off
        </button>
      ) : <span />}
    </div>
  );
}

function RefreshHeaderButton() {
  const [spinning, setSpinning] = useState(false);
  const onClick = () => {
    setSpinning(true);
    window.dispatchEvent(new CustomEvent('admin-v2:refetch'));
    setTimeout(() => setSpinning(false), 600);
  };
  return (
    <button
      onClick={onClick}
      aria-label="Refresh"
      style={{
        width: 40, height: 40, borderRadius: t.radius.md,
        border: `1px solid ${t.line}`, background: t.surface,
        color: t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <RefreshCw size={16} style={{ animation: spinning ? 'admin-spin .6s linear' : undefined }} />
      <style>{`@keyframes admin-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

/**
 * Analytics-only right slot: the green 'N in app' pill, or 'Updated HH:MM' on
 * Live. Reads ?staff exactly as LiveLens does so both share one query/poll.
 */
function AnalyticsHeaderSlot({ onLive, params, onOpenLive }: {
  onLive: boolean; params: URLSearchParams; onOpenLive: () => void;
}) {
  const staff = onLive && params.get('staff') === '1';
  const q = useAnalyticsLive(staff, onLive);
  if (onLive) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: t.inkFaint }}>
        <span style={{ width: 7, height: 7, borderRadius: 4, background: t.ok }} />
        Updated {londonHM(q.data?.computed_at ?? null)}
      </span>
    );
  }
  return (
    <button type="button" onClick={onOpenLive} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, height: 34, padding: '0 12px', borderRadius: 999, border: 0,
      background: 'rgba(61,220,145,0.12)', color: t.okText, fontSize: 12, fontWeight: 800, cursor: 'pointer',
      fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 4, background: t.ok }} />
      {num(q.data?.now ?? null)} in app
    </button>
  );
}
