import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CreateProfile from "./pages/CreateProfile";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import Courses from "./pages/Courses";
import MyRatings from "./pages/MyRatings";
import TourCentral from "./pages/TourCentral";
import News from "./pages/News";
import ClubhouseFeed from "./pages/ClubhouseFeed";
import Explore from "./pages/Explore";
import MessagesPage from "./pages/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage";
import FriendsPage from "./pages/FriendsPage";
import FollowersPage from "./pages/FollowersPage";
import FollowingPage from "./pages/FollowingPage";
import AdminSetupPage from "./pages/AdminSetupPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

import Settings from "./pages/Settings";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/create-profile" element={<CreateProfile />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:username" element={<UserProfilePage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/my-ratings" element={<MyRatings />} />
            <Route path="/tour-central" element={<TourCentral />} />
            <Route path="/news" element={<News />} />
            <Route path="/clubhouse" element={<ClubhouseFeed />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/followers" element={<FollowersPage />} />
            <Route path="/following" element={<FollowingPage />} />
            <Route path="/admin-setup" element={<AdminSetupPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
