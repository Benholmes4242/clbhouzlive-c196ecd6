import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import ScrollToTop from '@/components/ScrollToTop';
import { ThemeProvider } from '@/components/theme-provider';
import SiteAccessControl from "@/components/SiteAccessControl";
import AccessGateV2 from "@/components/AccessGateV2";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { GlobalLoadingProvider } from "@/loading/GlobalLoading";
import GlobalSpinner from "@/loading/GlobalSpinner";
import BindLoadingBus from "@/loading/BindLoadingBus";
import ClbhouzPageSpinner from "@/components/ui/ClbhouzPageSpinner";
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
import { HubProvider } from '@/features/hub/useHub';
import { initRecentMediaListener } from '@/hooks/usePostSubmission/recentMediaListener';
import { longPressHandler } from '@/utils/longPressHandler';
import AppShell from '@/components/AppShell';
import { ReviewIslandLoader } from '@/ReviewIslandLoader';
import { supabase } from '@/integrations/supabase/client';
import { migrateChatHistory } from '@/utils/chatHistoryMigration';


// Direct import for ProfilePage and Discover to avoid dynamic import issues
import ProfilePage from "./pages/ProfilePage";
import Discover from "./pages/Discover";
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
const Settings = lazy(() => import("./pages/Settings"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage"));
const UserCoursesPage = lazy(() => import("./pages/UserCoursesPage"));
const MyRatings = lazy(() => import("./pages/MyRatings"));
const News = lazy(() => import("./pages/News"));
const TourCentral = lazy(() => import("./pages/TourCentral"));

const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const FriendsPage = lazy(() => import("./pages/FriendsPage"));
const FollowersPage = lazy(() => import("./pages/FollowersPage"));
const FollowingPage = lazy(() => import("./pages/FollowingPage"));

const GlobalTop100 = lazy(() => import("./pages/GlobalTop100"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const AdminSetupPage = lazy(() => import("./pages/AdminSetupPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
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
const HubSwingHistoryPage = lazy(() => import("./features/hub/pages/HubSwingHistoryPage").then(m => ({ default: m.HubSwingHistoryPage })));
const HubSwingDetailPage = lazy(() => import("./features/hub/pages/HubSwingDetailPage").then(m => ({ default: m.HubSwingDetailPage })));
const HubEchoHistoryDetailPage = lazy(() => import("./features/hub/pages/HubEchoHistoryDetailPage"));

// Videos2 page
const VideosPage = lazy(() => import("./features/videos2/pages/VideosPage"));

const NotFound = lazy(() => import("./pages/NotFound"));

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
        <Route path="/profile/:username" element={<UserProfilePage />} />
        <Route path="/settings" element={<SettingsWrapped />} />
        <Route path="/clubhouse" element={<ClubhouseWrapped />} />
        <Route path="/discover" element={<DiscoverWrapped />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/user/:username/courses" element={<UserCoursesPage />} />
        <Route path="/my-ratings" element={<MyRatings />} />
        <Route path="/news" element={<News />} />
        <Route path="/tour-central" element={<TourCentral />} />
        <Route path="/videos" element={<VideosPage />} />
        
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/followers" element={<FollowersPage />} />
        <Route path="/following" element={<FollowingPage />} />
        
        <Route path="/global-top100" element={<GlobalTop100 />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/admin-setup" element={<AdminSetupPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin-backfill" element={<AdminBackfill />} />
        
        <Route path="/channel/:slug" element={<ChannelProfile />} />
        <Route path="/game/:id" element={<GameDetailView />} />
        
        {/* Hub routes - only when NOT using background location */}
        {!showHubOverlay && FEATURE_FLAGS.HUB && (
          <>
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
      gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
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

const App: React.FC = () => {
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
    <AppShell>
      <ReviewIslandLoader />
      <GlobalLoadingProvider>
        <BindLoadingBus />
        <ThemeProvider defaultTheme="light" storageKey="clbhouz-ui-theme">
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <SecurityHeaders />
              <AccessGate>
                <HeaderProvider>
                  <ModalProvider>
                    <BottomNavigationProvider>
                      <UIProvider>
                      <BrowserRouter>
                        <HubProvider>
                        <ScrollToTop />
                        <GlobalAudioProvider>
                          <VideoManagerProvider>
                            <VideoPlaybackManagerProvider>
                              <TopTenProvider>
                                <AuthWrapper>
                                   <Suspense fallback={<ClbhouzPageSpinner />}>
                                   <div className="app-depth">
                                   {/* No global header - each page renders its own ClubhouseHeaderNew */}
                                   <AppRoutes />
                                   </div>
                                 </Suspense>
                              </AuthWrapper>
                            </TopTenProvider>
                          </VideoPlaybackManagerProvider>
                        </VideoManagerProvider>
                      </GlobalAudioProvider>
                      <Toaster />
                      <Sonner />
                      <GlobalBottomNavigation />
                        </HubProvider>
                    </BrowserRouter>
                  </UIProvider>
                </BottomNavigationProvider>
                </ModalProvider>
              </HeaderProvider>
            </AccessGate>
        </TooltipProvider>
      </QueryClientProvider>
      </ThemeProvider>
      <GlobalSpinner />
    </GlobalLoadingProvider>
    </AppShell>
  );
};

export default App;
