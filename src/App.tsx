import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from '@/components/ScrollToTop';
import { ThemeProvider } from '@/components/theme-provider';
import SiteAccessControl from "@/components/SiteAccessControl";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { GlobalLoadingProvider } from "@/loading/GlobalLoading";
import GlobalSpinner from "@/loading/GlobalSpinner";
import BindLoadingBus from "@/loading/BindLoadingBus";
import ClbhouzPageSpinner from "@/components/ui/ClbhouzPageSpinner";
import AuthWrapper from "@/components/auth/AuthWrapper";
import { GlobalAudioProvider } from './contexts/GlobalAudioContext';
import { VideoManagerProvider } from './contexts/VideoManagerContext';
import { VideoPlaybackManagerProvider } from './contexts/VideoPlaybackManager';
import AIChat from "@/components/ai-chat/AIChat";
import { useImageUploadSafeguard } from '@/hooks/useImageUploadSafeguard';
import { useGlobalMemoryMonitor } from '@/hooks/useMemoryMonitor';
import { usePresenceTracker } from '@/hooks/usePresenceTracker';
import { useNearbyPresencePublisher } from '@/hooks/useNearbyPresencePublisher';
import { useLocationPermission } from '@/features/nearby/hooks/useLocationPermission';
import { TopTenProvider } from '@/context/TopTenContext';
import { UIProvider } from '@/contexts/UIContext';
import { ModalProvider } from '@/contexts/ModalContext';
import { BottomNavigationProvider } from '@/contexts/BottomNavigationContext';
import GlobalBottomNavigation from '@/components/GlobalBottomNavigation';
import { FLAGS } from '@/config/flags';
import { initRecentMediaListener } from '@/hooks/usePostSubmission/recentMediaListener';
import { longPressHandler } from '@/utils/longPressHandler';
import AppShell from '@/components/AppShell';
import { ReviewIslandLoader } from '@/ReviewIslandLoader';
import { supabase } from '@/integrations/supabase/client';


// Direct import for ProfilePage and Discover to avoid dynamic import issues
import ProfilePage from "./pages/ProfilePage";
import Discover from "./pages/Discover";
import { HeaderProvider } from '@/contexts/GlobalHeaderContext';
import GlobalHeader from '@/components/GlobalHeader';

// Import wrapped components with explicit variants
import ClubhouseWrapped from "./pages/ClubhouseWrapped";
import DiscoverWrapped from "./pages/DiscoverWrapped";
import ProfileWrapped from "./pages/ProfileWrapped";
import SettingsWrapped from "./pages/SettingsWrapped";
import AuthWrapped from "./pages/AuthWrapped";

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

const NotFound = lazy(() => import("./pages/NotFound"));

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

const App: React.FC = () => {
  // Enforce R2-only policy globally
  useImageUploadSafeguard();
  
  // Monitor global memory usage
  useGlobalMemoryMonitor(60000); // Check every minute
  
  // Track user presence for nearby golfers feature (legacy - keeping for backwards compat)
  usePresenceTracker();
  
  // NEW: Publish nearby presence using Realtime Presence
  const { currentLocation, getCurrentLocation } = useLocationPermission();
  
  useNearbyPresencePublisher({
    getCurrentPayload: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get visibility mode and location from user_nearby_status
      const { data: status } = await supabase
        .from('user_nearby_status')
        .select('visibility_mode, lat, lng')
        .eq('user_id', user.id)
        .single();

      // Get home club from profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('home_club')
        .eq('id', user.id)
        .single();

      const visibility_mode = (status?.visibility_mode || 'hidden') as 'hidden' | 'friends' | 'all';
      
      // Only track location if not hidden
      let lat = status?.lat ?? null;
      let lng = status?.lng ?? null;
      
      // If we don't have coords but visibility is not hidden, try to get current location
      if (visibility_mode !== 'hidden' && (!lat || !lng)) {
        const loc = currentLocation || await getCurrentLocation();
        if (loc) {
          lat = loc.lat;
          lng = loc.lng;
        }
      }

      return {
        user_id: user.id,
        visibility_mode,
        lat,
        lng,
        home_club: profile?.home_club || null,
      };
    },
  });
  
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
              <SiteAccessControl>
                <HeaderProvider>
                  <ModalProvider>
                    <BottomNavigationProvider>
                      <UIProvider>
                      <BrowserRouter>
                        <ScrollToTop />
                        <GlobalAudioProvider>
                          <VideoManagerProvider>
                            <VideoPlaybackManagerProvider>
                              <TopTenProvider>
                                <AuthWrapper>
                                  <Suspense fallback={<ClbhouzPageSpinner />}>
                                  {/* Global header should render before routes so it sits at the top in normal flow */}
                                  <GlobalHeader />
                                  <Routes>
                                    <Route path="/" element={<ClubhouseWrapped />} />
                                    <Route path="/auth" element={<AuthWrapped />} />
                                    <Route path="/create-profile" element={<CreateProfile />} />
                                    <Route path="/profile" element={<ProfileWrapped />} />
                                    <Route path="/profile-test" element={<ProfileTestPage />} />
                                    <Route path="/profile/:username" element={<UserProfilePage />} />
                                    <Route path="/settings" element={<SettingsWrapped />} />
                                    {/* Explore route removed - redirects to discover */}
                                    <Route path="/clubhouse" element={<ClubhouseWrapped />} />
                                    <Route path="/discover" element={<DiscoverWrapped />} />
                                    <Route path="/courses" element={<Courses />} />
                                    <Route path="/courses/:courseId" element={<CourseDetailPage />} />
                                    <Route path="/user/:username/courses" element={<UserCoursesPage />} />
                                    <Route path="/my-ratings" element={<MyRatings />} />
                                    <Route path="/news" element={<News />} />
                                    <Route path="/tour-central" element={<TourCentral />} />
                                    
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
                                    
                                    <Route path="*" element={<NotFound />} />
                                  </Routes>
                                </Suspense>
                              </AuthWrapper>
                            </TopTenProvider>
                          </VideoPlaybackManagerProvider>
                        </VideoManagerProvider>
                      </GlobalAudioProvider>
                      <Toaster />
                      <Sonner />
                      <AIChat />
                      <GlobalBottomNavigation />
                    </BrowserRouter>
                  </UIProvider>
                </BottomNavigationProvider>
                </ModalProvider>
              </HeaderProvider>
            </SiteAccessControl>
        </TooltipProvider>
      </QueryClientProvider>
      </ThemeProvider>
      <GlobalSpinner />
    </GlobalLoadingProvider>
    </AppShell>
  );
};

export default App;
