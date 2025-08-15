import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from '@/components/ScrollToTop';
import { ThemeProvider } from '@/components/theme-provider';
import SiteAccessControl from "@/components/SiteAccessControl";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import ClubhouzLoading from "@/components/ClubhouzLoading";
import AuthWrapper from "@/components/auth/AuthWrapper";
import { GlobalAudioProvider } from './contexts/GlobalAudioContext';
import { VideoManagerProvider } from './contexts/VideoManagerContext';
import { VideoPlaybackManagerProvider } from './contexts/VideoPlaybackManager';


const Auth = lazy(() => import("./pages/Auth"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const CreateProfile = lazy(() => import("./pages/CreateProfile"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const Settings = lazy(() => import("./pages/Settings"));
// Explore page removed - replaced by Discover
const Clubhouse = lazy(() => import("./pages/Clubhouse"));
const Discover = lazy(() => import("./pages/Discover"));
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

const AdminSetupPage = lazy(() => import("./pages/AdminSetupPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (v5 uses gcTime instead of cacheTime)
      refetchOnMount: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 0,
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="clbhouz-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SecurityHeaders />
          <SiteAccessControl>
            <BrowserRouter>
              <ScrollToTop />
              <GlobalAudioProvider>
                <VideoManagerProvider>
                  <VideoPlaybackManagerProvider>
                    <AuthWrapper>
                    <Suspense fallback={<ClubhouzLoading />}>
                      <Routes>
                        <Route path="/" element={<Clubhouse />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/create-profile" element={<CreateProfile />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/profile/:username" element={<UserProfilePage />} />
                        <Route path="/settings" element={<Settings />} />
                        {/* Explore route removed - redirects to discover */}
                        <Route path="/clubhouse" element={<Clubhouse />} />
                        <Route path="/discover" element={<Discover />} />
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
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                    </AuthWrapper>
                  </VideoPlaybackManagerProvider>
                </VideoManagerProvider>
              </GlobalAudioProvider>
              <Toaster />
              <Sonner />
            </BrowserRouter>
          </SiteAccessControl>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
