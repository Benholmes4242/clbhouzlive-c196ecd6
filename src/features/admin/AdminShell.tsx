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

const SECTION_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  users:     'Users',
  content:   'Content',
  analytics: 'Analytics',
  system:    'System',
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
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="users/*"     element={can.manageAdmins ? <UsersPage /> : <AdminAccessDenied />} />
                <Route path="content/*"   element={<ContentPage />} />
                <Route path="analytics/*" element={can.manageAdmins ? <AnalyticsPage /> : <AdminAccessDenied />} />
                <Route path="system/*"    element={<SystemPage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
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
