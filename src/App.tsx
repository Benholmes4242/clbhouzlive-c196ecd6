import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from '@/components/ScrollToTop';
import { ThemeProvider } from '@/components/theme-provider';
import PasswordProtection from "@/components/PasswordProtection";
import AuthWrapper from "@/components/auth/AuthWrapper";


const Auth = lazy(() => import("./pages/Auth"));
const CreateProfile = lazy(() => import("./pages/CreateProfile"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const Settings = lazy(() => import("./pages/Settings"));
const Explore = lazy(() => import("./pages/Explore"));
const Clubhouse = lazy(() => import("./pages/Clubhouse"));
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
const Top100Explorer = lazy(() => import("./pages/Top100Explorer"));
const AdminSetupPage = lazy(() => import("./pages/AdminSetupPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="clbhouz-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <PasswordProtection>
            <BrowserRouter>
              <ScrollToTop />
            <Suspense fallback={
              <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                  <div 
                    className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                    style={{ borderBottomColor: '#f7931e' }}
                  ></div>
                  <p className="mt-2 text-muted-foreground">Loading...</p>
                </div>
              </div>
            }>
              <AuthWrapper>
                <Routes>
                  <Route path="/" element={<Clubhouse />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/create-profile" element={<CreateProfile />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/:username" element={<UserProfilePage />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/clubhouse" element={<Clubhouse />} />
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
                  <Route path="/top100-explorer" element={<Top100Explorer />} />
                  <Route path="/admin-setup" element={<AdminSetupPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthWrapper>
            </Suspense>
              <Toaster />
              <Sonner />
            </BrowserRouter>
          </PasswordProtection>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
