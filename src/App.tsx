import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import 'mapbox-gl/dist/mapbox-gl.css';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import ScrollToTop from '@/components/ScrollToTop';
import { ScrollRestoration } from '@/components/ScrollRestoration';
import { ThemeProvider } from '@/components/theme-provider';
import SiteAccessControl from "@/components/SiteAccessControl";
import AccessGateV2 from "@/components/AccessGateV2";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { AppBootstrapLoader } from "@/components/AppBootstrapLoader";
import AuthWrapper from "@/components/auth/AuthWrapper";
import { GlobalAudioProvider } from './contexts/GlobalAudioContext';
import { VideoManagerProvider } from './contexts/VideoManagerContext';
import { VideoPlaybackManagerProvider } from './contexts/VideoPlaybackManager';
import { useImageUploadSafeguard } from '@/hooks/useImageUploadSafeguard';
import { useGlobalMemoryMonitor } from '@/hooks/useMemoryMonitor';
import { usePresenceTracker } from '@/hooks/usePresenceTracker';
import { useLocationBroadcast } from '@/features/nearby/hooks/useLocationBroadcast';
import { TopTenProvider } from '@/context/TopTenContext';
import { UIProvider } from '@/contexts/UIContext';
import { ModalProvider } from '@/contexts/ModalContext';
import { BottomNavigationProvider } from '@/contexts/BottomNavigationContext';
import GlobalBottomNavigation from '@/components/GlobalBottomNavigation';
import { FLAGS } from '@/config/flags';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { ClubhouseSkeleton } from '@/components/skeletons/ClubhouseSkeleton';
import { CourseDetailSkeleton } from '@/components/skeletons/CourseDetailSkeleton';
import { CoursesListSkeleton } from '@/components/skeletons/CoursesListSkeleton';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { DiscoverSkeleton } from '@/components/skeletons/DiscoverSkeleton';
import { TourSkeleton } from '@/components/skeletons/TourSkeleton';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';
import { HubSkeleton } from '@/components/skeletons/HubSkeleton';
import { RateCoursePageSkeleton } from '@/components/skeletons/RateCoursePageSkeleton';
import { HubProvider } from '@/features/hub/useHub';
import { initRecentMediaListener } from '@/hooks/usePostSubmission/recentMediaListener';
import { longPressHandler } from '@/utils/longPressHandler';
import AppShell from '@/components/AppShell';
import { ReviewIslandLoader } from '@/ReviewIslandLoader';
import { supabase } from '@/integrations/supabase/client';
import { migrateChatHistory } from '@/utils/chatHistoryMigration';
import { PanelGuard } from "@/components/admin/PanelGuard";
import { ToastHost } from '@/components/toast/ToastHost';
import { AchievementToastContainer } from '@/components/achievements/AchievementToastContainer';
import { LevelUpToastContainer } from '@/components/achievements/LevelUpToastContainer';
import { useAchievementSharing } from '@/hooks/useAchievementSharing';
import { useTop100XpNotifications } from '@/hooks/useTop100XpNotifications';



// Lazy-load ProfilePage and Discover for smaller initial bundle
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const Discover = lazy(() => import("./pages/Discover"));
import ErrorLogPage from "./pages/ErrorLogPage";
import { HeaderProvider } from '@/contexts/GlobalHeaderContext';


// Import wrapped components with explicit variants
import ClubhouseWrapped from "./pages/ClubhouseWrapped";
import DiscoverWrapped from "./pages/DiscoverWrapped";
import ProfileWrapped from "./pages/ProfileWrapped";
import SettingsWrapped from "./pages/SettingsWrapped";
import AuthWrapped from "./pages/AuthWrapped";
import { useModalContext } from '@/contexts/ModalContext';

// Lazy load other pages for better code splitting and loading screen experience
const Auth = lazy(() => import("./pages/Auth"));
const Clubhouse = lazy(() => import("./pages/Clubhouse"));
const CreateProfile = lazy(() => import("./pages/CreateProfile"));
const ProfileTestPage = lazy(() => import("./pages/ProfileTestPage"));
const AdminBackfill = lazy(() => import("./pages/AdminBackfill"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const UserReviewsPage = lazy(() => import("./pages/UserReviewsPage"));
const Settings = lazy(() => import("./pages/Settings"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage"));
const CourseReviewsPage = lazy(() => import("./pages/CourseReviewsPage"));
const RateCoursePage = lazy(() => import("./pages/RateCoursePage"));
const UserCoursesPage = lazy(() => import("./pages/UserCoursesPage"));
const MyRatings = lazy(() => import("./pages/MyRatings"));
const News = lazy(() => import("./pages/News"));
const TourCentral = lazy(() => import("./pages/TourCentral"));

const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const GolfersToFollowPage = lazy(() => import("./pages/GolfersToFollowPage"));
const GolfersSharedCoursesPage = lazy(() => import("./pages/GolfersSharedCoursesPage"));
const FriendsPage = lazy(() => import("./pages/FriendsPage"));
const FollowersPage = lazy(() => import("./pages/FollowersPage"));
const FollowingPage = lazy(() => import("./pages/FollowingPage"));
const FollowersListPage = lazy(() => import("./pages/FollowersListPage"));
const FollowingListPage = lazy(() => import("./pages/FollowingListPage"));
const FriendsListPage = lazy(() => import("./pages/FriendsListPage"));

const Top100Hub = lazy(() => import("./pages/Top100Hub"));
const Top100List = lazy(() => import("./pages/Top100List"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const AchievementsHub = lazy(() => import("./pages/AchievementsHub"));
const AdminSetupPage = lazy(() => import("./pages/AdminSetupPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminLanding = lazy(() => import("./pages/admin/AdminLanding").then(m => ({ default: m.AdminLanding })));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage").then(m => ({ default: m.AdminUsersPage })));
const AdminMembersPage = lazy(() => import("./pages/admin/AdminMembersPage").then(m => ({ default: m.AdminMembersPage })));
const AdminOverviewPage = lazy(() => import("./pages/admin/AdminOverviewPage").then(m => ({ default: m.AdminOverviewPage })));
const AdminInvitesPage = lazy(() => import("./pages/admin/AdminInvitesPage").then(m => ({ default: m.AdminInvitesPage })));
const InviteAcceptPage = lazy(() => import("./pages/admin/InviteAcceptPage").then(m => ({ default: m.InviteAcceptPage })));

// Legacy admin pages
const GolfCoursesPage = lazy(() => import("./pages/admin/GolfCoursesPage").then(m => ({ default: m.GolfCoursesPage })));
const GolfCourseEditorPage = lazy(() => import("./pages/admin/GolfCourseEditorPage"));
const LogosPage = lazy(() => import("./pages/admin/LogosPage").then(m => ({ default: m.LogosPage })));
const CountryFlagsPage = lazy(() => import("./pages/admin/CountryFlagsPage").then(m => ({ default: m.CountryFlagsPage })));
const CourseImportPage = lazy(() => import("./pages/admin/CourseImportPage").then(m => ({ default: m.CourseImportPage })));
const AnalyticsPage = lazy(() => import("./features/admin/pages/AdminAnalyticsPage").then(m => ({ default: m.AdminAnalyticsPage })));
const AdminEchoAnalyticsPage = lazy(() => import("./features/admin/pages/AdminEchoAnalyticsPage").then(m => ({ default: m.AdminEchoAnalyticsPage })));
const TeamPage = lazy(() => import("./pages/admin/TeamPage").then(m => ({ default: m.TeamPage })));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage").then(m => ({ default: m.AdminSettingsPage })));

const ChannelProfile = lazy(() => import("./pages/ChannelProfile"));
const GameDetailView = lazy(() => import("./features/game/GameDetailView"));

// Hub components (lazy load when feature flag is enabled)
const HubHomePage = lazy(() => import("./features/hub/pages/HubHomePage").then(m => ({ default: m.HubHomePage })));
const HubGolfersPage = lazy(() => import("./features/hub/pages/HubGolfersPage").then(m => ({ default: m.HubGolfersPage })));
const HubEchoChatPage = lazy(() => import("./features/hub/pages/HubEchoChatPage").then(m => ({ default: m.HubEchoChatPage })));
const HubCreateGamePage = lazy(() => import("./features/hub/pages/HubCreateGamePage").then(m => ({ default: m.HubCreateGamePage })));
const HubGamesPage = lazy(() => import("./features/hub/pages/HubGamesPage").then(m => ({ default: m.HubGamesPage })));
const HubYourGamesPage = lazy(() => import("./features/hub/pages/HubYourGamesPage").then(m => ({ default: m.HubYourGamesPage })));
const HubSwingPage = lazy(() => import("./features/hub/pages/HubSwingPage").then(m => ({ default: m.HubSwingPage })));
const HubEchoHistoryPage = lazy(() => import("./features/hub/pages/HubEchoHistoryPage").then(m => ({ default: m.HubEchoHistoryPage })));
const HubEchoSharePage = lazy(() => import("./features/hub/pages/HubEchoSharePage").then(m => ({ default: m.HubEchoSharePage })));
const HubEchoTagsPage = lazy(() => import("./features/hub/pages/HubEchoTagsPage"));
const HubSwingHistoryPage = lazy(() => import("./features/hub/pages/HubSwingHistoryPage").then(m => ({ default: m.HubSwingHistoryPage })));
const HubSwingDetailPage = lazy(() => import("./features/hub/pages/HubSwingDetailPage").then(m => ({ default: m.HubSwingDetailPage })));
const HubEchoHistoryDetailPage = lazy(() => import("./features/hub/pages/HubEchoHistoryDetailPage"));

// Public Echo Share Page
const EchoSharePage = lazy(() => import("./pages/EchoSharePage").then(m => ({ default: m.EchoSharePage })));

// Videos2 page
const VideosPage = lazy(() => import("./features/videos2/pages/VideosPage"));
const SeasonShop = lazy(() => import("./pages/SeasonShop"));
const ChallengesPage = lazy(() => import("./pages/ChallengesPage"));

const NotFound = lazy(() => import("./pages/NotFound"));
const CreateMomentPage = lazy(() => import("./pages/CreateMomentPage"));

// Import season wrap modal
import { SeasonWrapModal } from '@/components/season/SeasonWrapModal';

// Routes component that handles background location pattern for Hub overlays
function AppRoutes() {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location; fromHub?: boolean } | null;
  const { shouldHideHeader } = useModalContext();
  
  // Render origin page when we have a background location
  const routesLocation = state?.backgroundLocation || location;
  
  // Hub overlay = /hub or /hub/* with backgroundLocation
  const isHubRoute = location.pathname === '/hub' || location.pathname.startsWith('/hub/');
  const showHubOverlay = isHubRoute && !!state?.backgroundLocation;
  
  // Global overlay detection - sync with <html> class
  const overlayActive = showHubOverlay || shouldHideHeader;
  
  useEffect(() => {
    const el = document.documentElement;
    if (overlayActive) {
      el.classList.add('overlay-open');
    } else {
      el.classList.remove('overlay-open');
    }
  }, [overlayActive]);

  return (
    <>
      <Routes location={routesLocation}>
        <Route path="/" element={<ClubhouseWrapped />} />
        <Route path="/auth" element={<AuthWrapped />} />
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/profile" element={<ProfileWrapped />} />
        <Route path="/profile-test" element={<ProfileTestPage />} />
        <Route path="/profile/:username" element={<Suspense fallback={<ProfileSkeleton />}><UserProfilePage /></Suspense>} />
        <Route path="/profile/:username/reviews" element={<UserReviewsPage />} />
        <Route path="/settings" element={<SettingsWrapped />} />
        <Route path="/clubhouse" element={<Suspense fallback={<ClubhouseSkeleton />}><ClubhouseWrapped /></Suspense>} />
        <Route path="/discover" element={<Suspense fallback={<DiscoverSkeleton />}><DiscoverWrapped /></Suspense>} />
        <Route path="/courses" element={<Suspense fallback={<CoursesListSkeleton />}><Courses /></Suspense>} />
        <Route path="/courses/:courseId" element={<Suspense fallback={<CourseDetailSkeleton />}><CourseDetailPage /></Suspense>} />
        <Route path="/courses/:courseId/rate" element={<Suspense fallback={<RateCoursePageSkeleton />}><RateCoursePage /></Suspense>} />
        <Route path="/courses/:courseId/reviews" element={<Suspense fallback={<CourseDetailSkeleton />}><CourseReviewsPage /></Suspense>} />
        <Route path="/user/:username/courses" element={<UserCoursesPage />} />
        <Route path="/my-ratings" element={<MyRatings />} />
        <Route path="/news" element={<News />} />
        <Route path="/tour-central" element={<Suspense fallback={<TourSkeleton />}><TourCentral /></Suspense>} />
        <Route path="/videos" element={<Suspense fallback={<GenericPageSkeleton layout="grid" count={6} />}><VideosPage /></Suspense>} />
          <Route path="/season-shop" element={<Suspense fallback={<GenericPageSkeleton layout="grid" count={6} />}><SeasonShop /></Suspense>} />
          <Route path="/challenges" element={<Suspense fallback={<GenericPageSkeleton />}><ChallengesPage /></Suspense>} />
        
        <Route path="/messages" element={<Suspense fallback={<GenericPageSkeleton />}><MessagesPage /></Suspense>} />
        <Route path="/notifications" element={<Suspense fallback={<GenericPageSkeleton />}><NotificationsPage /></Suspense>} />
        <Route path="/golferstofollow" element={<Suspense fallback={<GenericPageSkeleton />}><GolfersToFollowPage /></Suspense>} />
        <Route path="/golferssharedcourses" element={<Suspense fallback={<GenericPageSkeleton />}><GolfersSharedCoursesPage /></Suspense>} />
        <Route path="/friends" element={<Suspense fallback={<GenericPageSkeleton />}><FriendsPage /></Suspense>} />
        <Route path="/followers" element={<Suspense fallback={<GenericPageSkeleton />}><FollowersPage /></Suspense>} />
        <Route path="/following" element={<Suspense fallback={<GenericPageSkeleton />}><FollowingPage /></Suspense>} />
        <Route path="/profile/:username/followers" element={<Suspense fallback={<GenericPageSkeleton />}><FollowersListPage /></Suspense>} />
        <Route path="/profile/:username/following" element={<Suspense fallback={<GenericPageSkeleton />}><FollowingListPage /></Suspense>} />
        <Route path="/profile/:username/friends" element={<Suspense fallback={<GenericPageSkeleton />}><FriendsListPage /></Suspense>} />
        
        <Route path="/top100" element={<Top100Hub />} />
        <Route path="/top100/:slug" element={<Top100List />} />
        <Route path="/admin-setup" element={<AdminSetupPage />} />
        
        {/* Admin routes wrapped with AdminLayout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminLanding />} />
          <Route path="overview" element={
            <PanelGuard need="admins">
              <AdminOverviewPage />
            </PanelGuard>
          } />
          <Route path="users" element={
            <PanelGuard need="users">
              <AdminUsersPage />
            </PanelGuard>
          } />
          <Route path="admins" element={
            <PanelGuard need="admins">
              <AdminMembersPage />
            </PanelGuard>
          } />
          <Route path="invites" element={
            <PanelGuard need="admins">
              <AdminInvitesPage />
            </PanelGuard>
          } />
          
          {/* Legacy/management sections */}
          <Route path="golf-courses" element={<GolfCoursesPage />} />
          <Route path="logos" element={<LogosPage />} />
          <Route path="country-flags" element={<CountryFlagsPage />} />
          <Route path="courses" element={<CourseImportPage />} />
          <Route path="analytics" element={
            <PanelGuard need="admins">
              <AnalyticsPage />
            </PanelGuard>
          } />
          <Route path="analytics/echo" element={
            <PanelGuard need="admins">
              <AdminEchoAnalyticsPage />
            </PanelGuard>
          } />
          <Route path="team" element={<TeamPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
        
        <Route path="/create-moment" element={<CreateMomentPage />} />
        <Route path="/error-logs" element={<ErrorLogPage />} />
        
        {/* Public Echo Share Page */}
        <Route path="/echo/share/:token" element={<EchoSharePage />} />
        
        {/* Golf Course Editor - full page routes outside AdminLayout */}
        <Route path="/admin/golf-courses/new" element={<GolfCourseEditorPage />} />
        <Route path="/admin/golf-courses/:id/edit" element={<GolfCourseEditorPage />} />
        
        <Route path="/admin/invite-accept" element={<InviteAcceptPage />} />
        <Route path="/admin-backfill" element={<AdminBackfill />} />

        <Route path="/channel/:slug" element={<ChannelProfile />} />
        <Route path="/game/:id" element={<GameDetailView />} />
        
        {/* Hub routes - only when NOT using background location */}
        {!showHubOverlay && FEATURE_FLAGS.HUB && (
          <>
            <Route path="/hub" element={<Suspense fallback={<HubSkeleton />}><HubHomePage /></Suspense>} />
            <Route path="/hub/golfers" element={<Suspense fallback={<HubSkeleton />}><HubGolfersPage /></Suspense>} />
            <Route path="/hub/echo" element={<Suspense fallback={<HubSkeleton />}><HubEchoChatPage /></Suspense>} />
            <Route path="/hub/create-game" element={<Suspense fallback={<HubSkeleton />}><HubCreateGamePage /></Suspense>} />
            <Route path="/hub/games" element={<Suspense fallback={<HubSkeleton />}><HubGamesPage /></Suspense>} />
            <Route path="/hub/your-games" element={<Suspense fallback={<HubYourGamesPage />}><HubYourGamesPage /></Suspense>} />
            <Route path="/hub/swing" element={<Suspense fallback={<HubSkeleton />}><HubSwingPage /></Suspense>} />
          <Route path="/hub/swing/history" element={<Suspense fallback={<HubSkeleton />}><HubSwingHistoryPage /></Suspense>} />
          <Route path="/hub/swing/history/:id" element={<Suspense fallback={<HubSkeleton />}><HubSwingDetailPage /></Suspense>} />
          <Route path="/hub/echo/history" element={<Suspense fallback={<HubSkeleton />}><HubEchoHistoryPage /></Suspense>} />
          <Route path="/hub/echo/history/chat/:id" element={<Suspense fallback={<HubSkeleton />}><HubEchoHistoryDetailPage /></Suspense>} />
          <Route path="/hub/echo/tags" element={<Suspense fallback={<HubSkeleton />}><HubEchoTagsPage /></Suspense>} />
          <Route path="/echo/share/:token" element={<Suspense fallback={<HubSkeleton />}><HubEchoSharePage /></Suspense>} />
          <Route path="/hub/new" element={<Navigate to="/hub/echo/history" replace />} />
          </>
        )}
        
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Hub Overlays - rendered over origin page when background location exists */}
      {showHubOverlay && FEATURE_FLAGS.HUB && (
        <Routes>
          <Route path="/hub" element={<HubHomePage />} />
          <Route path="/hub/golfers" element={<HubGolfersPage />} />
          <Route path="/hub/echo" element={<HubEchoChatPage />} />
          <Route path="/hub/create-game" element={<HubCreateGamePage />} />
          <Route path="/hub/games" element={<HubGamesPage />} />
          <Route path="/hub/your-games" element={<HubYourGamesPage />} />
          <Route path="/hub/swing" element={<HubSwingPage />} />
          <Route path="/hub/swing/history" element={<HubSwingHistoryPage />} />
          <Route path="/hub/swing/history/:id" element={<HubSwingDetailPage />} />
          <Route path="/hub/echo/history" element={<HubEchoHistoryPage />} />
          <Route path="/hub/echo/history/chat/:id" element={<HubEchoHistoryDetailPage />} />
          <Route path="/hub/echo/tags" element={<HubEchoTagsPage />} />
          <Route path="/echo/share/:token" element={<HubEchoSharePage />} />
          <Route path="/hub/new" element={<Navigate to="/hub/echo/history" replace />} />
        </Routes>
      )}
    </>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: FLAGS.perfTuning ? {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes cache for better performance
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection (reduced from 15)
      refetchOnMount: false,
      refetchOnReconnect: false,
      networkMode: 'online',
    } : {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 0, // Always fetch fresh data
      gcTime: 60 * 1000, // 1 minute cache
      refetchOnMount: 'always',
      refetchOnReconnect: 'always',
      networkMode: 'always'
    },
    mutations: {
      retry: 0,
      networkMode: 'always'
    },
  },
  // Phase 3: Add error handlers for better debugging
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error('[ReactQuery] Query error:', {
        queryKey: query.queryKey,
        error: error instanceof Error ? error.message : error
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error('[ReactQuery] Mutation error:', error);
    },
  }),
});

// Global focus re-auth to reduce retries
function useReauthOnFocus() {
  useEffect(() => {
    const onFocus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) await supabase.auth.refreshSession().catch(() => {});
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && onFocus());
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus as any);
    };
  }, []);
}

// Achievement Toast Wrapper Component
const AchievementToastWrapper: React.FC = () => {
  const { prepareAchievementShare } = useAchievementSharing();
  return (
    <>
      <AchievementToastContainer onShare={prepareAchievementShare} />
      <LevelUpToastContainer onShare={prepareAchievementShare} />
    </>
  );
};

// AppInner - All hooks that need React Query context
const AppInner: React.FC = () => {
  // Feature flag for access gate version
  const useV2Gate = import.meta.env.VITE_ACCESS_GATE_VERSION?.toString().toLowerCase() === "v2";
  const AccessGate = useV2Gate ? AccessGateV2 : SiteAccessControl;
  
  // Global focus re-auth hook
  useReauthOnFocus();
  
  // Enforce R2-only policy globally
  useImageUploadSafeguard();
  
  // Monitor global memory usage
  useGlobalMemoryMonitor(60000); // Check every minute
  
  // Track user presence for nearby golfers feature
  usePresenceTracker();
  
  // Continuously broadcast location when visibility is active
  useLocationBroadcast();
  
  // Listen for Top 100 XP notifications
  useTop100XpNotifications();
  
  // Run chat history migration once on app init
  useEffect(() => {
    migrateChatHistory();
  }, []);
  
  // Initialize recent media listener for SnapModal thumbnails
  useEffect(() => {
    initRecentMediaListener();
  }, []);
  
  // Initialize long press handler
  useEffect(() => {
    longPressHandler.init();
    return () => longPressHandler.cleanup();
  }, []);
  
  // Keep realtime socket authenticated after token refresh
  useEffect(() => {
    const setupRealtimeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }
    };

    setupRealtimeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return (
    <TooltipProvider>
      <SecurityHeaders />
      <AccessGate>
        <HeaderProvider>
          <ModalProvider>
            <BottomNavigationProvider>
              <UIProvider>
                <ToastHost>
                  <BrowserRouter>
                    <HubProvider>
                      <ScrollToTop />
                      <ScrollRestoration />
                      <GlobalAudioProvider>
                        <VideoManagerProvider>
                          <VideoPlaybackManagerProvider>
                            <TopTenProvider>
                              <ErrorBoundary>
                                <AuthWrapper>
                                  <SeasonWrapModal />
                                  <AchievementToastWrapper />
                                  <Suspense fallback={null}>
                                    <div className="app-depth">
                                      {/* No global header - each page renders its own ClubhouseHeaderNew */}
                                      <AppRoutes />
                                    </div>
                                  </Suspense>
                                </AuthWrapper>
                              </ErrorBoundary>
                            </TopTenProvider>
                          </VideoPlaybackManagerProvider>
                        </VideoManagerProvider>
                      </GlobalAudioProvider>
                      <Toaster />
                      <Sonner />
                      <GlobalBottomNavigation />
                    </HubProvider>
                  </BrowserRouter>
                </ToastHost>
              </UIProvider>
            </BottomNavigationProvider>
          </ModalProvider>
        </HeaderProvider>
      </AccessGate>
    </TooltipProvider>
  );
};

// App - Outer wrapper with QueryClientProvider
const App: React.FC = () => {
  return (
    <AppShell>
      <ReviewIslandLoader />
      <ThemeProvider defaultTheme="light" storageKey="clbhouz-ui-theme">
        <QueryClientProvider client={queryClient}>
          <AppInner />
        </QueryClientProvider>
      </ThemeProvider>
    </AppShell>
  );
};

export default App;
