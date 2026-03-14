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

  // Full-screen loading while role resolves
  if (loading) return <AdminV2Loading />;

  // No access at all
  if (role === 'none' || role === 'unknown') return <AdminV2AccessDenied role={role} />;

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] grid-rows-[52px_1fr] bg-background">
      {/* Sidebar — spans both rows */}
      <div className="row-span-2 border-r border-border/60 overflow-hidden">
        <AdminV2Sidebar role={role} can={can} />
      </div>

      {/* Header — top right */}
      <div className="border-b border-border/60">
        <AdminV2Header />
      </div>

      {/* Main content — bottom right, scrollable */}
      <main className="overflow-y-auto">
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Analytics */}
            <Route path="analytics/platform" element={can.manageAdmins ? <PlatformAnalytics /> : <AdminV2AccessDenied role={role} />} />
            <Route path="analytics/content" element={can.manageAdmins ? <ContentAnalytics /> : <AdminV2AccessDenied role={role} />} />
            <Route path="analytics/auth" element={can.manageAdmins ? <AuthAnalytics /> : <AdminV2AccessDenied role={role} />} />

            {/* Users & Access */}
            <Route path="users" element={can.manageAdmins ? <UsersPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="verifications" element={can.manageAdmins ? <VerificationsPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="team" element={can.manageAdmins ? <TeamPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="invites" element={can.manageAdmins ? <InvitesPage /> : <AdminV2AccessDenied role={role} />} />

            {/* Content — available to all admin roles */}
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/import" element={<CourseImportPage />} />
            <Route path="tour" element={can.manageAdmins ? <TourPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="tour/players" element={can.manageAdmins ? <TourPlayersPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="businesses" element={can.manageAdmins ? <BusinessesPage /> : <AdminV2AccessDenied role={role} />} />

            {/* Assets */}
            <Route path="assets" element={can.manageAdmins ? <AssetsPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="assets/logos" element={can.manageAdmins ? <LogosPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="assets/college-logos" element={can.manageAdmins ? <CollegeLogosPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="assets/flags" element={can.manageAdmins ? <FlagsPage /> : <AdminV2AccessDenied role={role} />} />

            {/* System */}
            <Route path="audit" element={can.manageAdmins ? <AuditPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Dev Tools */}
            <Route path="tools/geocoding" element={can.manageAdmins ? <GeocodingPage /> : <AdminV2AccessDenied role={role} />} />
            <Route path="tools/testlab" element={can.manageAdmins ? <TestLabPage /> : <AdminV2AccessDenied role={role} />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
