import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import AdminV2Sidebar from './components/shell/AdminV2Sidebar';
import AdminV2Header from './components/shell/AdminV2Header';
import AdminV2Loading from './components/ui/AdminV2Loading';
import AdminV2AccessDenied from './components/ui/AdminV2AccessDenied';
import { AdminCommandPalette } from './components/ui';

// Lazy-loaded pages
const DashboardPage        = lazy(() => import('./pages/DashboardPage'));
const UsersPage            = lazy(() => import('./pages/UsersPage'));
const VerificationsPage    = lazy(() => import('./pages/VerificationsPage'));
const TeamPage             = lazy(() => import('./pages/TeamPage'));
const InvitesPage          = lazy(() => import('./pages/InvitesPage'));
const CoursesPage          = lazy(() => import('./pages/CoursesPage'));
const CourseImportPage     = lazy(() => import('./pages/CourseImportPage'));
const TourPage             = lazy(() => import('./pages/TourPage'));
const TourPlayersPage      = lazy(() => import('./pages/TourPlayersPage'));
const BusinessesPage       = lazy(() => import('./pages/BusinessesPage'));
const AssetsPage           = lazy(() => import('./pages/AssetsPage'));
const LogosPage            = lazy(() => import('./pages/LogosPage'));
const CollegeLogosPage     = lazy(() => import('./pages/CollegeLogosPage'));
const FlagsPage            = lazy(() => import('./pages/FlagsPage'));
const AuditPage            = lazy(() => import('./pages/AuditPage'));
const SettingsPage         = lazy(() => import('./pages/SettingsPage'));
const PlatformAnalytics    = lazy(() => import('./pages/analytics/PlatformAnalyticsPage'));
const ContentAnalytics     = lazy(() => import('./pages/analytics/ContentAnalyticsPage'));
const AuthAnalytics        = lazy(() => import('./pages/analytics/AuthAnalyticsPage'));
const EngagementAnalytics  = lazy(() => import('./pages/analytics/EngagementAnalyticsPage'));
const NavigationAnalytics  = lazy(() => import('./pages/analytics/NavigationAnalyticsPage'));
const EchoAnalytics        = lazy(() => import('./pages/analytics/EchoAnalyticsPage'));
const SocialAnalytics      = lazy(() => import('./pages/analytics/SocialAnalyticsPage'));
const RetentionAnalytics   = lazy(() => import('./pages/analytics/RetentionPage'));
const ContentPerformance   = lazy(() => import('./pages/analytics/ContentPerformancePage'));
const CreatorLeaderboard   = lazy(() => import('./pages/analytics/CreatorLeaderboardPage'));
const GrowthAnalytics      = lazy(() => import('./pages/analytics/GrowthPage'));
const FeatureAdoption      = lazy(() => import('./pages/analytics/FeatureAdoptionPage'));
const LiveActivityPage     = lazy(() => import('./pages/LiveActivityPage'));
const AnomalyAlertsPage    = lazy(() => import('./pages/AnomalyAlertsPage'));
const LeaderboardsPage     = lazy(() => import('./pages/LeaderboardsPage'));
const GeocodingPage        = lazy(() => import('./pages/tools/GeocodingPage'));
const TestLabPage          = lazy(() => import('./pages/tools/TestLabPage'));

// Page-level loading skeleton
const PageSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="h-8 w-48 rounded-lg bg-muted" />
    <div className="h-4 w-72 rounded bg-muted" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 rounded-xl bg-muted" />
      ))}
    </div>
    <div className="h-64 rounded-xl bg-muted" />
  </div>
);

export default function AdminV2Shell() {
  const { role, loading } = usePanelRole();
  const can = panelCan(role);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Full-screen loading while role resolves
  if (loading) return <AdminV2Loading />;

  // No access at all
  if (role === 'none' || role === 'unknown') return <AdminV2AccessDenied role={role} />;

  return (
    <div
      className="min-h-screen"
      style={{
        display: 'grid',
        gridTemplateColumns: sidebarOpen && !isMobile ? '260px 1fr' : '1fr',
        gridTemplateRows: 'calc(52px + max(env(safe-area-inset-top, 0px), 47px)) 1fr',
        height: '100dvh',
        overflow: 'hidden',
        position: 'relative',
        background: '#F8FAFC',
      }}
    >
      {/* Mobile backdrop */}
      {sidebarOpen && isMobile && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar panel */}
      <div style={{
        ...(isMobile ? {
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 260, zIndex: 50,
          paddingTop: 'env(safe-area-inset-top, 0px)',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        } : {
          gridRow: '1 / 3',
          display: sidebarOpen ? 'flex' : 'none',
          flexDirection: 'column' as const,
        }),
      }}>
        <AdminV2Sidebar
          role={role}
          can={can}
          onNavigate={() => { if (isMobile) setSidebarOpen(false); }}
        />
      </div>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #E2E8F0' }}>
        <AdminV2Header
          onOpenPalette={() => setPaletteOpen(true)}
          onToggleSidebar={() => setSidebarOpen(v => !v)}
          sidebarOpen={sidebarOpen}
        />
      </div>

      {/* Main content */}
      <main className="overflow-y-auto">
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="analytics/platform" element={can.manageAdmins ? <PlatformAnalytics /> : <AdminV2AccessDenied role={role} />} />
            <Route path="analytics/engagement" element={can.manageAdmins ? <EngagementAnalytics /> : <AdminV2AccessDenied role={role} />} />
            <Route path="analytics/navigation" element={can.manageAdmins ? <NavigationAnalytics /> : <AdminV2AccessDenied role={role} />} />
            <Route path="analytics/echo" element={can.manageAdmins ? <EchoAnalytics /> : <AdminV2AccessDenied role={role} />} />
            <Route path="analytics/social" element={can.manageAdmins ? <SocialAnalytics /> : <AdminV2AccessDenied role={role} />} />
            <Route path="analytics/content" element={can.manageAdmins ? <ContentAnalytics /> : <AdminV2AccessDenied role={role} />} />
            <Route path="analytics/auth" element={can.manageAdmins ? <AuthAnalytics /> : <AdminV2AccessDenied role={role} />} />
            <Route path="analytics/retention" element={can.manageAdmins ? <RetentionAnalytics /> : <AdminV2AccessDenied role={role} />} />
            <Route path="analytics/content-performance" element={can.manageAdmins ? <ContentPerformance /> : <AdminV2AccessDenied role={role} />} />
            <Route path="analytics/creator-leaderboard" element={can.manageAdmins ? <CreatorLeaderboard /> : <AdminV2AccessDenied role={role} />} />
            <Route path="analytics/growth" element={can.manageAdmins ? <GrowthAnalytics /> : <AdminV2AccessDenied role={role} />} />
            <Route path="analytics/feature-adoption" element={can.manageAdmins ? <FeatureAdoption /> : <AdminV2AccessDenied role={role} />} />
            <Route path="users" element={can.manageAdmins ? <UsersPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="verifications" element={can.manageAdmins ? <VerificationsPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="team" element={can.manageAdmins ? <TeamPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="invites" element={can.manageAdmins ? <InvitesPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/import" element={<CourseImportPage />} />
            <Route path="tour" element={can.manageAdmins ? <TourPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="tour/players" element={can.manageAdmins ? <TourPlayersPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="leaderboards" element={can.manageAdmins ? <LeaderboardsPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="businesses" element={can.manageAdmins ? <BusinessesPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="assets" element={can.manageAdmins ? <AssetsPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="assets/logos" element={can.manageAdmins ? <LogosPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="assets/college-logos" element={can.manageAdmins ? <CollegeLogosPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="assets/flags" element={can.manageAdmins ? <FlagsPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="audit" element={can.manageAdmins ? <AuditPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="tools/geocoding" element={can.manageAdmins ? <GeocodingPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="tools/testlab" element={can.manageAdmins ? <TestLabPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>

      <AdminCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}