import React, { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, RefreshCw } from 'lucide-react';
import { usePanelRole } from '@/hooks/usePanelRole';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { panelCan } from '@/lib/panelCan';
import { adminTheme as t } from './theme';
import AdminDrawer from './AdminDrawer';
import AdminLoading from './components/AdminLoading';
import AdminAccessDenied from './components/AdminAccessDenied';


const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const ContentPage = lazy(() => import('./pages/ContentPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const HealthPage = lazy(() => import('./pages/HealthPage'));
const InboxPage = lazy(() => import('./pages/InboxPage'));

const SECTION_TITLES: Record<string, string> = {
  dashboard:  'Dashboard',
  inbox:      'Inbox',
  users:      'Members',
  content:    'Content',
  analytics:  'Analytics',
  health:     'Health',
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

  // Admin owns the notch: dark bar (#0A0D12) with LIGHT content (white glyphs).
  // Route-scoped so keep-alive member pages can't repaint it on resume.
  useMedianStatusBar(
    'light',
    t.canvas,
    false,
    false,
    true,
    location.pathname,
    (p) => p.startsWith('/admin-v2'),
  );

  if (loading) return <AdminLoading />;
  if (role === 'none' || role === 'unknown') return <AdminAccessDenied />;

  const can = panelCan(role);
  const segment = location.pathname.split('/')[2] ?? 'dashboard';
  const title = SECTION_TITLES[segment] ?? 'Admin';

  const headerHeight = 'calc(52px + max(env(safe-area-inset-top, 0px), 47px))';

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
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
          background: t.surface,
          borderBottom: `1px solid ${t.line}`,
          display: 'flex', alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', width: '100%' }}>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            style={{
              width: 40, height: 40, borderRadius: t.radius.md,
              border: `1px solid ${t.line}`, background: t.surface,
              color: t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Menu size={18} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, marginLeft: 4 }}>
            <span style={{ color: t.inkFaint, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
              Admin
            </span>
            <span style={{ color: t.ink, fontSize: 15, fontWeight: 700 }}>{title}</span>
          </div>
          <div style={{ flex: 1 }} />
          <RefreshHeaderButton />
        </div>
      </header>

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
