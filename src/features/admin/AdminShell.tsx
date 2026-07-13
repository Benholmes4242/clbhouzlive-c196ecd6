import React, { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, RefreshCw } from 'lucide-react';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import { adminTheme as t } from './theme';
import AdminDrawer from './AdminDrawer';
import AdminLoading from './components/AdminLoading';
import AdminAccessDenied from './components/AdminAccessDenied';


const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const ContentPage = lazy(() => import('./pages/ContentPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SystemPage = lazy(() => import('./pages/SystemPage'));
const ModerationPage = lazy(() => import('./pages/ModerationPage'));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage'));
const MatchRequestsPage = lazy(() => import('./pages/MatchRequestsPage'));
const AppealsPage = lazy(() => import('./pages/AppealsPage'));

const SupportPage = lazy(() => import('./pages/SupportPage'));
const VerificationsPage = lazy(() => import('./pages/VerificationsPage'));
const VideoPerfPage = lazy(() => import('./pages/VideoPerfPage'));
const EchoHealthPage = lazy(() => import('./pages/EchoHealthPage'));
const PushHealthPage = lazy(() => import('./pages/PushHealthPage'));

const SECTION_TITLES: Record<string, string> = {
  dashboard:  'Dashboard',
  moderation: 'Moderation',
  approvals:  'Approvals',
  'match-requests': 'Match Requests',
  appeals:    'Appeals',
  users:      'Users',
  content:    'Content',
  analytics:  'Analytics',
  system:     'System',
  
  support:    'Support',
  verifications: 'Verifications',
  'video-perf': 'Video Perf',
  'echo-health': 'Echo Health',
  'push-health': 'Push Health',
};

export default function AdminShell() {
  const { role, loading } = usePanelRole();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  if (loading) return <AdminLoading />;
  if (role === 'none' || role === 'unknown') return <AdminAccessDenied />;

  const can = panelCan(role);
  const segment = location.pathname.split('/')[2] ?? 'dashboard';
  const title = SECTION_TITLES[segment] ?? 'Admin';

  const headerHeight = 'calc(52px + max(env(safe-area-inset-top, 0px), 47px))';

  return (
    <div style={{ minHeight: '100dvh', background: t.canvas, color: t.ink }}>
      {/* Drawer */}
      <AdminDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={role}
        canManageAdmins={can.manageAdmins}
      />

      {/* Header */}
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

      {/* Content */}
      <main style={{ paddingTop: headerHeight, minHeight: '100dvh' }}>
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
                <Route index element={<Navigate to={role === 'moderator' ? 'moderation' : 'dashboard'} replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="moderation/*" element={can.viewModeration ? <ModerationPage /> : <AdminAccessDenied />} />
                <Route path="approvals/*"  element={can.approveRequests ? <ApprovalsPage /> : <AdminAccessDenied />} />
                <Route path="match-requests/*" element={can.viewUsers ? <MatchRequestsPage /> : <AdminAccessDenied />} />
                <Route path="appeals/*"    element={can.viewModeration ? <AppealsPage /> : <AdminAccessDenied />} />
                <Route path="users/*"     element={can.viewUsers ? <UsersPage /> : <AdminAccessDenied />} />
                <Route path="content/*"   element={<ContentPage />} />
                <Route path="analytics/*" element={can.manageAdmins ? <AnalyticsPage /> : <AdminAccessDenied />} />
                <Route path="system/*"    element={<SystemPage />} />
                
                <Route path="support/*"   element={can.viewModeration ? <SupportPage /> : <AdminAccessDenied />} />
                <Route path="verifications/*" element={can.viewUsers ? <VerificationsPage /> : <AdminAccessDenied />} />
                <Route path="video-perf/*" element={<VideoPerfPage />} />
                <Route path="echo-health/*" element={can.manageAdmins ? <EchoHealthPage /> : <AdminAccessDenied />} />
                <Route path="push-health/*" element={can.manageAdmins ? <PushHealthPage /> : <AdminAccessDenied />} />
                <Route path="*" element={<Navigate to={role === 'moderator' ? 'moderation' : 'dashboard'} replace />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// Refresh button reads from the dashboard's query keys via window event
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
