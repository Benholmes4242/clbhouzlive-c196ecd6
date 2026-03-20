import React, { Suspense, lazy, useEffect, useLayoutEffect, useMemo } from "react";
import { MessagingProvider } from '@/contexts/MessagingContext';

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import 'mapbox-gl/dist/mapbox-gl.css';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams, useNavigate } from "react-router-dom";
import { setNavigateRef } from '@/utils/navigation';
import ScrollToTop from '@/components/ScrollToTop';
import { ScrollRestoration } from '@/components/ScrollRestoration';
import { ThemeProvider } from '@/components/theme-provider';
import BetaAccessGate from "@/components/BetaAccessGate";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { AppBootstrapLoader } from "@/components/AppBootstrapLoader";
import AuthWrapper from "@/components/auth/AuthWrapper";
import { GlobalAudioProvider } from './contexts/GlobalAudioContext';
// REMOVED: FullscreenPlayerProvider — Phase 5 fullscreen system deleted
import { RehydrationProvider } from './contexts/RehydrationContext';
// RETIRED: VideoManagerProvider and VideoPlaybackManagerProvider
// These competed with MediaRuntime for playback control.
// All playback is now centralized in MediaSystemProvider.
import { MediaSystemProvider } from './media';
// Eagerly preload hls.js at app startup to eliminate first-load delay
import '@/utils/hlsLoader';
import { useImageUploadSafeguard } from '@/hooks/useImageUploadSafeguard';
import { useGlobalMemoryMonitor } from '@/hooks/useMemoryMonitor';
import { usePresenceTracker } from '@/hooks/usePresenceTracker';
import { useAudioBridge } from '@/hooks/useAudioBridge';
import { useLocationBroadcast } from '@/features/nearby/hooks/useLocationBroadcast';
import { TopTenProvider } from '@/context/TopTenContext';
import { VideoPlaybackProvider } from '@/context/VideoPlaybackContext';
import { ActiveActorProvider } from '@/context/ActiveActorContext';
import { Top100DebugProvider } from '@/context/Top100DebugContext';
import { UIProvider } from '@/contexts/UIContext';
import { ModalProvider } from '@/contexts/ModalContext';
import { BottomNavigationProvider } from '@/contexts/BottomNavigationContext';

import { PostEventsBridge } from '@/events/PostEventsBridge';
import { UploadToastsBridge } from '@/uploads/UploadToastsBridge';
import UploadProgressBanner from '@/components/uploads/UploadProgressBanner';
import GlobalBottomNavigation from '@/components/GlobalBottomNavigation';
import { GlobalPostStudio } from '@/components/post-studio/GlobalPostStudio';
import { FullscreenFeedOverlay } from '@/components/fullscreen-feed/FullscreenFeedOverlay';
import { UploadResilienceProvider } from '@/contexts/UploadResilienceContext';
import { useUploadGuard } from '@/hooks/useUploadGuard';
import { FLAGS } from '@/config/flags';
import { FEATURE_FLAGS } from '@/config/featureFlags';

import { CourseDetailSkeleton } from '@/components/skeletons/CourseDetailSkeleton';
import { CoursesListSkeleton } from '@/components/skeletons/CoursesListSkeleton';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { DiscoverSkeleton } from '@/components/skeletons/DiscoverSkeleton';

import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';
import { AchievementsSkeleton } from '@/components/skeletons/AchievementsSkeleton';
import { ActivityPageSkeleton } from '@/components/skeletons/ActivityPageSkeleton';
import { HubSkeleton } from '@/components/skeletons/HubSkeleton';
import { RateCoursePageSkeleton } from '@/components/skeletons/RateCoursePageSkeleton';
import { initRecentMediaListener } from '@/hooks/usePostSubmission/recentMediaListener';
import { longPressHandler } from '@/utils/longPressHandler';
import AppShell from '@/components/AppShell';
import { ReviewIslandLoader } from '@/ReviewIslandLoader';
import { supabase } from '@/integrations/supabase/client';
import { migrateChatHistory } from '@/utils/chatHistoryMigration';


import { AchievementToastContainer } from '@/components/achievements/AchievementToastContainer';
import { LevelUpToastContainer } from '@/components/achievements/LevelUpToastContainer';
import { useAchievementSharing } from '@/hooks/useAchievementSharing';
import { useTop100XpNotifications } from '@/hooks/useTop100XpNotifications';
import { useCourseRatingsRealtime } from '@/hooks/useCourseRatingsRealtime';



// Lazy-load Discover for smaller initial bundle
const Discover = lazy(() => import("./pages/Discover"));
import ErrorLogPage from "./pages/ErrorLogPage";
import { HeaderProvider } from '@/contexts/GlobalHeaderContext';
import GlobalHeader from '@/components/header/GlobalHeader';
import { isImmersiveRoute } from '@/components/header/globalHeaderRules';
import { KeepAliveOutlet } from '@/components/keep-alive/KeepAliveOutlet';


// Import wrapped components with explicit variants
import ClubhouseWrapped from "./pages/ClubhouseWrapped";
import DiscoverWrapped from "./pages/DiscoverWrapped";
import CoursesWrapped from "./pages/CoursesWrapped";
import ProfileWrapped from "./pages/ProfileWrapped";
import SettingsWrapped from "./pages/SettingsWrapped";
import AuthWrapped from "./pages/AuthWrapped";
import { useModalContext } from '@/contexts/ModalContext';

// Lazy load other pages for better code splitting and loading screen experience
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/auth/AuthCallback"));
const VerifiedPage = lazy(() => import("./pages/auth/VerifiedPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const Signup = lazy(() => import("./pages/Signup"));
const CheckEmailPage = lazy(() => import("./pages/auth/CheckEmailPage"));
const Clubhouse = lazy(() => import("./pages/Clubhouse"));
const WatchPage = lazy(() => import("./pages/WatchPage"));
const AccountTypeOnboarding = lazy(() => import("./pages/onboarding/AccountTypeOnboarding"));


const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));
const ProfileHandicapView = lazy(() => import("./pages/ProfileHandicapView"));
const ProfileQuestView = lazy(() => import("./pages/ProfileQuestView"));
const QuestIndexView = lazy(() => import("./pages/QuestIndexView"));
const QuestReplayView = lazy(() => import("./pages/QuestReplayView"));

const UserReviewsPage = lazy(() => import("./pages/UserReviewsPage"));
// Old Settings page removed - now using SettingsPageV2 via SettingsWrapped
// Courses page now uses CoursesWrapped (imported above) which handles header/dim reset
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage"));
const CourseReviewsPage = lazy(() => import("./pages/CourseReviewsPage"));
const RateCoursePage = lazy(() => import("./pages/RateCoursePage"));
const ShareReviewPage = lazy(() => import("./pages/ShareReviewPage"));
const UserCoursesPage = lazy(() => import("./pages/UserCoursesPage"));
const MyRatings = lazy(() => import("./pages/MyRatings"));
const JourneyListPage = lazy(() => import("./pages/JourneyListPage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const News = lazy(() => import("./pages/News"));



const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ActivityPageWrapped = lazy(() => import("./pages/ActivityPageWrapped"));
const GolfersToFollowPage = lazy(() => import("./pages/GolfersToFollowPage"));
const GolfersSharedCoursesPage = lazy(() => import("./pages/GolfersSharedCoursesPage"));
const OwnProfileSocialRedirect = lazy(() => import("./components/profile/OwnProfileSocialRedirect"));
const FollowersListPage = lazy(() => import("./pages/FollowersListPage"));
const FollowingListPage = lazy(() => import("./pages/FollowingListPage"));
const FriendsListPage = lazy(() => import("./pages/FriendsListPage"));
const FriendsActivityPage = lazy(() => import("./pages/FriendsActivityPage"));
const CreateProfileRedirect = lazy(() => import("./components/redirects/CreateProfileRedirect"));


const Top100Hub = lazy(() => import("./pages/Top100Hub"));
const Top100List = lazy(() => import("./pages/Top100List"));

const AchievementsHubPage = lazy(() => import("./pages/AchievementsHubPage"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const AdminSetupPage = lazy(() => import("./pages/AdminSetupPage"));
const AdminV2Shell = lazy(() => import('./features/admin-v2/AdminV2Shell'));



const ChannelProfile = lazy(() => import("./pages/ChannelProfile"));
const GameDetailView = lazy(() => import("./features/game/GameDetailView"));

// Hub lazy imports removed — Hub page decommissioned

// Echo full-page experience
const EchoPage = lazy(() => import("./pages/EchoPage"));

// Games feature pages
const DiscoverGamesPage = lazy(() => import("./features/games/pages/DiscoverGamesPage"));


// Public Echo Share Page
const EchoSharePage = lazy(() => import("./pages/EchoSharePage").then(m => ({ default: m.EchoSharePage })));

// Tour Hub pages
const TourHubHomePage = lazy(() => import("./features/tourhub/pages").then(m => ({ default: m.TourHubHomePage })));
const TourHubLivePage = lazy(() => import("./features/tourhub/pages").then(m => ({ default: m.TourHubLivePage })));
const TourHubTourPage = lazy(() => import("./features/tourhub/pages").then(m => ({ default: m.TourHubTourPage })));
const TourHubEventPage = lazy(() => import("./features/tourhub/pages").then(m => ({ default: m.TourHubEventPage })));
const TourHubPlayerPage = lazy(() => import("./features/tourhub/pages").then(m => ({ default: m.TourHubPlayerPage })));
const TourHubRankingsPage = lazy(() => import("./features/tourhub/pages").then(m => ({ default: m.TourHubRankingsPage })));
const TourHubMainPage = lazy(() => import("./features/tourhub/pages").then(m => ({ default: m.TourHubMainPage })));
const TournamentDetailPage = lazy(() => import("./features/tourhub/pages").then(m => ({ default: m.TournamentDetailPage })));
const PlayerProfilePage = lazy(() => import("./features/tourhub/pages").then(m => ({ default: m.PlayerProfilePage })));
const CollegeGolfHubPage = lazy(() => import("./features/tourhub/pages").then(m => ({ default: m.CollegeGolfHubPage })));
const CollegeProfilePage = lazy(() => import("./features/tourhub/pages").then(m => ({ default: m.CollegeProfilePage })));
const CollegeComparePage = lazy(() => import("./features/tourhub/pages").then(m => ({ default: m.CollegeComparePage })));
import { TourNavWrapper } from './features/tourhub/components/TourNavWrapper';

// Video Player Modal (Phase 6A-1)
// Video Player Modal (Phase 6A-1)
const VideoPlayerModal = lazy(() => import("./components/videos/VideoPlayerModal"));
const MiniPlayer = lazy(() => import("./components/videos/MiniPlayer"));
const GlobalQueueDrawer = lazy(() => import("./components/videos/GlobalQueueDrawer"));
const SeasonShop = lazy(() => import("./pages/SeasonShop"));
const ChallengesPage = lazy(() => import("./pages/ChallengesPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));

const BusinessDirectoryPage = lazy(() => import("./pages/BusinessDirectoryPage"));
const BusinessInsightsPageV2 = lazy(() => import("./pages/BusinessInsightsPageV2"));
const BusinessProfilePage = lazy(() => import("./pages/BusinessProfilePage"));
const BusinessFollowersPage = lazy(() => import("./pages/BusinessFollowersPage"));
const MyBusinessesPage = lazy(() => import("./pages/MyBusinessesPage"));
const BusinessCreatePage = lazy(() => import("./pages/BusinessCreatePage"));
const BusinessIntroPage = lazy(() => import("./pages/BusinessIntroPage"));
const BusinessEditWizard = lazy(() => import("./components/business/edit/BusinessEditWizard"));
const BusinessProfileLiveSuccessPage = lazy(() => import("./pages/BusinessProfileLiveSuccessPage"));
const BusinessVerificationAboutPage = lazy(() => import("./pages/BusinessVerificationAboutPage"));
const BusinessVerificationWizardPage = lazy(() => import("./pages/BusinessVerificationWizardPage"));
const BusinessVerificationRequestPage = lazy(() => import("./pages/BusinessVerificationRequestPage"));
const BusinessVerificationSubmittedPage = lazy(() => import("./pages/BusinessVerificationSubmittedPage"));
const BusinessVerificationStatusPage = lazy(() => import("./pages/BusinessVerificationStatusPage"));
const BusinessDomainVerifyPage = lazy(() => import("./pages/BusinessDomainVerifyPage"));
const BusinessTeamPage = lazy(() => import("./pages/BusinessTeamPage"));
const BusinessInvitePage = lazy(() => import("./pages/BusinessInvitePage"));
const BusinessActivityPage = lazy(() => import("./pages/BusinessActivityPage"));
// ManageTeamPage removed — now handled via ManageTeamModal bottom sheet

const NotFound = lazy(() => import("./pages/NotFound"));
// PostsTabTestPage removed — Posts tab now integrated into profiles
// CreateMomentPage removed — PostStudio is now the sole creation flow
const PostDeepLinkPage = lazy(() => import("./pages/PostDeepLinkPage"));
const CommentDeepLinkPage = lazy(() => import("./components/comments/CommentDeepLinkHandler"));

// Import season wrap modal
import { SeasonWrapModal } from '@/components/season/SeasonWrapModal';

// Creator routes removed - now handled via Business Creator profiles or Personal Creator Mode


// Component to set navigate ref for use outside React components
function NavigationRefSetter() {
  const navigate = useNavigate();
  
  useEffect(() => {
    setNavigateRef(navigate);
  }, [navigate]);

  return null;
}

// Routes component that handles background location pattern for Hub overlays and Video modal
function AppRoutes() {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location; fromHub?: boolean; fromVideo?: boolean } | null;
  const { shouldHideHeader } = useModalContext();
  
  // BUG-1 FIX: Reset shield to transparent on every route change as a baseline.
  // Individual page hooks then opt-in to their own color (e.g. PageRoot → #F8FAFC).
  // This prevents stale shield colors when navigating back to immersive/KeepAlive pages.
  useLayoutEffect(() => {
    // Reset shield
    const shield = document.getElementById('safe-area-shield');
    if (shield) shield.style.backgroundColor = 'transparent';
    // Reset html/body to prevent stale grey bleeding through WebView compositing
    document.documentElement.style.backgroundColor = 'transparent';
    document.body.style.backgroundColor = 'transparent';

    // FIX: Mark immersive routes so CSS can suppress .app-shell's
    // #F8FAFC background-color before the hero page mounts.
    // This eliminates the grey safe-area flash on return navigation.
    if (isImmersiveRoute(location.pathname)) {
      document.documentElement.setAttribute('data-immersive-route', 'true');
    } else {
      document.documentElement.removeAttribute('data-immersive-route');
    }
  }, [location.pathname]);
  
  // Render origin page when we have a background location
  const routesLocation = state?.backgroundLocation || location;
  
  // Video modal = /video/:id with backgroundLocation
  const isVideoRoute = location.pathname.startsWith('/video/');
  const showVideoModal = isVideoRoute && !!state?.backgroundLocation;
  
  // Global overlay detection - sync with <html> class
  const overlayActive = showVideoModal || shouldHideHeader;
  
  useEffect(() => {
    const el = document.documentElement;
    if (overlayActive) {
      el.classList.add('overlay-open');
    } else {
      el.classList.remove('overlay-open');
    }
  }, [overlayActive]);

  // Keep-alive routes configuration - these routes stay mounted when navigating away
  const keepAliveRoutes = useMemo(() => [
    { path: '/', element: <ClubhouseWrapped /> },
  ], []);

  return (
    <>
      {/* Set navigate ref for use in toast actions and other non-component code */}
      <NavigationRefSetter />
      
      {/* Keep-Alive Portal Container - Preserves Clubhouse state across tab navigation */}
      <KeepAliveOutlet keepAliveRoutes={keepAliveRoutes} maxCached={2} />
      
      <Routes location={routesLocation}>
        {/* Keep-alive routes - rendered by KeepAliveOutlet, but need placeholder for Router */}
        <Route path="/" element={null} />
        <Route path="/clubhouse" element={<Navigate to="/" replace />} />
        
        <Route path="/auth" element={<AuthWrapped />} />
        <Route path="/auth/callback" element={<Suspense fallback={<GenericPageSkeleton />}><AuthCallback /></Suspense>} />
        <Route path="/auth/verified" element={<Suspense fallback={<GenericPageSkeleton />}><VerifiedPage /></Suspense>} />
        <Route path="/auth/reset-password" element={<Suspense fallback={<GenericPageSkeleton />}><ResetPasswordPage /></Suspense>} />
        <Route path="/auth/check-email" element={<Suspense fallback={<GenericPageSkeleton />}><CheckEmailPage /></Suspense>} />
        <Route path="/signup" element={<Suspense fallback={<GenericPageSkeleton />}><Signup /></Suspense>} />
        <Route path="/onboarding/account-type" element={<Suspense fallback={<GenericPageSkeleton />}><AccountTypeOnboarding /></Suspense>} />
        <Route path="/create-profile" element={<CreateProfileRedirect />} />
        <Route path="/profile" element={<ProfileWrapped />} />
        <Route path="/profile/handicap" element={<Suspense fallback={<ProfileSkeleton />}><ProfileHandicapView /></Suspense>} />
        <Route path="/profile/quest" element={<Suspense fallback={<ProfileSkeleton />}><ProfileQuestView /></Suspense>} />
        <Route path="/profile/quest/index" element={<Suspense fallback={<ProfileSkeleton />}><QuestIndexView /></Suspense>} />
        <Route path="/profile/quest/replay" element={<Navigate to="/achievements" replace />} />
        <Route path="/edit-profile" element={<Suspense fallback={<ProfileSkeleton />}><EditProfilePage /></Suspense>} />
        
        
        <Route path="/profile/:username" element={<ProfileWrapped />} />
        <Route path="/profile/:username/reviews" element={<Suspense fallback={<ProfileSkeleton />}><UserReviewsPage /></Suspense>} />
        <Route path="/settings" element={<SettingsWrapped />} />
        <Route path="/discover" element={<Suspense fallback={<DiscoverSkeleton />}><DiscoverWrapped /></Suspense>} />
        <Route path="/watch" element={<Suspense fallback={<GenericPageSkeleton />}><DiscoverWrapped /></Suspense>} />
        <Route path="/videos" element={<Suspense fallback={<DiscoverSkeleton />}><DiscoverWrapped /></Suspense>} />
        <Route path="/explore" element={<Suspense fallback={<DiscoverSkeleton />}><DiscoverWrapped /></Suspense>} />
        <Route path="/courses" element={<Suspense fallback={<CoursesListSkeleton />}><CoursesWrapped /></Suspense>} />
        <Route path="/courses/:courseId" element={<Suspense fallback={<CourseDetailSkeleton />}><CourseDetailPage /></Suspense>} />
        <Route path="/courses/:courseId/rate" element={<Suspense fallback={<RateCoursePageSkeleton />}><RateCoursePage /></Suspense>} />
        <Route path="/courses/:courseId/share-review/:reviewId" element={<Suspense fallback={<GenericPageSkeleton />}><ShareReviewPage /></Suspense>} />
        <Route path="/courses/:courseId/reviews" element={<Suspense fallback={<CourseDetailSkeleton />}><CourseReviewsPage /></Suspense>} />
        <Route path="/user/:username/courses" element={<Suspense fallback={<CoursesListSkeleton />}><UserCoursesPage /></Suspense>} />
        <Route path="/my-ratings" element={<Suspense fallback={<CoursesListSkeleton />}><MyRatings /></Suspense>} />
        <Route path="/journey" element={<Suspense fallback={<CoursesListSkeleton />}><JourneyListPage /></Suspense>} />
        <Route path="/map" element={<Suspense fallback={<GenericPageSkeleton />}><MapPage /></Suspense>} />
        <Route path="/friends-activity" element={<Suspense fallback={<CoursesListSkeleton />}><FriendsActivityPage /></Suspense>} />
        <Route path="/news" element={<Suspense fallback={<GenericPageSkeleton />}><News /></Suspense>} />
        
        {/* Post deep link for notifications */}
        <Route path="/post/:postId" element={<Suspense fallback={<GenericPageSkeleton />}><PostDeepLinkPage /></Suspense>} />
        <Route path="/post/:postId/comment/:commentId" element={<Suspense fallback={<GenericPageSkeleton />}><CommentDeepLinkPage /></Suspense>} />
        
        
        <Route path="/video/:videoId" element={<Suspense fallback={<GenericPageSkeleton />}><VideoPlayerModal /></Suspense>} />
        
        {/* Legacy creator routes - redirect to home (creators now handled via Business profiles or Personal Creator Mode) */}
        <Route path="/creator/*" element={<Navigate to="/" replace />} />
        <Route path="/creators/*" element={<Navigate to="/" replace />} />
<Route path="/season-shop" element={<Suspense fallback={<GenericPageSkeleton layout="grid" count={6} />}><SeasonShop /></Suspense>} />
        <Route path="/challenges" element={<Suspense fallback={<GenericPageSkeleton />}><ChallengesPage /></Suspense>} />
        
        <Route path="/insights" element={<Suspense fallback={<GenericPageSkeleton />}><InsightsPage /></Suspense>} />
        
        <Route path="/messages" element={<Suspense fallback={<GenericPageSkeleton />}><MessagesPage /></Suspense>} />
        <Route path="/messages/:conversationId" element={<Suspense fallback={<GenericPageSkeleton />}><MessagesPage /></Suspense>} />
        <Route path="/notificationmessages" element={<Suspense fallback={<ActivityPageSkeleton />}><ActivityPageWrapped /></Suspense>} />
        <Route path="/golferstofollow" element={<Suspense fallback={<GenericPageSkeleton />}><GolfersToFollowPage /></Suspense>} />
        <Route path="/golferssharedcourses" element={<Suspense fallback={<GenericPageSkeleton />}><GolfersSharedCoursesPage /></Suspense>} />
        <Route path="/friends" element={<Suspense fallback={<GenericPageSkeleton />}><OwnProfileSocialRedirect tab="friends" /></Suspense>} />
        
        <Route path="/followers" element={<Suspense fallback={<GenericPageSkeleton />}><OwnProfileSocialRedirect tab="followers" /></Suspense>} />
        <Route path="/following" element={<Suspense fallback={<GenericPageSkeleton />}><OwnProfileSocialRedirect tab="following" /></Suspense>} />
        <Route path="/profile/:username/followers" element={<Suspense fallback={<GenericPageSkeleton />}><FollowersListPage /></Suspense>} />
        <Route path="/profile/:username/following" element={<Suspense fallback={<GenericPageSkeleton />}><FollowingListPage /></Suspense>} />
        <Route path="/profile/:username/friends" element={<Suspense fallback={<GenericPageSkeleton />}><FriendsListPage /></Suspense>} />
        
        {/* Business routes */}
        <Route path="/business-profiles" element={<Navigate to="/businesses/manage" replace />} />
        <Route path="/businesses/manage" element={<Suspense fallback={<GenericPageSkeleton />}><MyBusinessesPage /></Suspense>} />
        <Route path="/business/intro" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessIntroPage /></Suspense>} />
        <Route path="/business/create" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessCreatePage /></Suspense>} />
        <Route path="/business/manage" element={<Navigate to="/businesses/manage" replace />} />
        <Route path="/business/insights" element={<Navigate to="/businesses/manage" replace />} />
        <Route path="/business/:id/insights" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessInsightsPageV2 /></Suspense>} />
        <Route path="/business/:id/edit" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessEditWizard /></Suspense>} />
        <Route path="/business/success" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessProfileLiveSuccessPage /></Suspense>} />
        <Route path="/business/:id/verification/about" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessVerificationAboutPage /></Suspense>} />
        <Route path="/business/:id/verification/wizard" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessVerificationWizardPage /></Suspense>} />
        <Route path="/business/:id/verification/request" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessVerificationRequestPage /></Suspense>} />
        <Route path="/business/:id/verification/submitted" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessVerificationSubmittedPage /></Suspense>} />
        <Route path="/business/:id/verification/status" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessVerificationStatusPage /></Suspense>} />
        <Route path="/business/:businessId/verification/domain" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessDomainVerifyPage /></Suspense>} />
        <Route path="/business/:businessId/team" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessTeamPage /></Suspense>} />
        <Route path="/business/:businessId/team/invite" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessInvitePage /></Suspense>} />
        {/* manage-team route removed — now handled via ManageTeamModal bottom sheet */}
        <Route path="/business/:businessId/activity" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessActivityPage /></Suspense>} />
        <Route path="/business/:idOrSlug/followers" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessFollowersPage /></Suspense>} />
        <Route path="/business/:idOrSlug" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessProfilePage /></Suspense>} />
        
        <Route path="/top100" element={<Suspense fallback={<CoursesListSkeleton />}><Top100Hub /></Suspense>} />
        <Route path="/top100/:slug" element={<Suspense fallback={<CoursesListSkeleton />}><Top100List /></Suspense>} />
        <Route path="/achievementshub" element={<Suspense fallback={<AchievementsSkeleton />}><AchievementsHubPage /></Suspense>} />
        <Route path="/achievements" element={<Suspense fallback={<AchievementsSkeleton />}><AchievementsPage /></Suspense>} />
        <Route path="/achievements/:userId" element={<Suspense fallback={<AchievementsSkeleton />}><AchievementsPage /></Suspense>} />
        <Route path="/admin-setup" element={<Suspense fallback={<GenericPageSkeleton />}><AdminSetupPage /></Suspense>} />
        
        {/* Old /admin routes removed — redirected to admin-v2 */}
        <Route path="/admin" element={<Navigate to="/admin-v2/dashboard" replace />} />
        <Route path="/admin/*" element={<Navigate to="/admin-v2/dashboard" replace />} />

        {/* Admin V2 — new standalone console */}
        <Route
          path="/admin-v2/*"
          element={
            <Suspense fallback={<GenericPageSkeleton />}>
              <AdminV2Shell />
            </Suspense>
          }
        />

        {/* /create-moment removed — PostStudio is now the sole creation flow */}
        <Route path="/error-logs" element={<ErrorLogPage />} />
        
        {/* Echo AI */}
        <Route path="/echo" element={<Suspense fallback={<HubSkeleton />}><EchoPage /></Suspense>} />
        <Route path="/echo/:conversationId" element={<Suspense fallback={<HubSkeleton />}><EchoPage /></Suspense>} />
        
        {/* Public Echo Share Page */}
        <Route path="/echo/share/:token" element={<Suspense fallback={<GenericPageSkeleton />}><EchoSharePage /></Suspense>} />
        


        <Route path="/channel/:slug" element={<Suspense fallback={<ProfileSkeleton />}><ChannelProfile /></Suspense>} />
        <Route path="/game/:id" element={<Suspense fallback={<GenericPageSkeleton />}><GameDetailView /></Suspense>} />
        
        {/* Games routes */}
        <Route path="/games/discover" element={<Suspense fallback={<GenericPageSkeleton />}><DiscoverGamesPage /></Suspense>} />
        <Route path="/nearby" element={<Navigate to="/games/discover" replace />} />
        
        {/* Tour Hub routes */}
        <Route path="/tourhub" element={<Suspense fallback={<GenericPageSkeleton />}><TourHubMainPage /></Suspense>} />
        <Route path="/tourhub/tournament/:tournamentId" element={<Suspense fallback={<GenericPageSkeleton />}><TourNavWrapper><TournamentDetailPage /></TourNavWrapper></Suspense>} />
        <Route path="/tourhub/player/:playerId" element={<Suspense fallback={<GenericPageSkeleton />}><TourNavWrapper><PlayerProfilePage /></TourNavWrapper></Suspense>} />
        <Route path="/tourhub/live" element={<Suspense fallback={<GenericPageSkeleton />}><TourHubLivePage /></Suspense>} />
        <Route path="/tourhub/tour/:tour" element={<Suspense fallback={<GenericPageSkeleton />}><TourHubTourPage /></Suspense>} />
        <Route path="/tourhub/event/:tour/:eventId" element={<Suspense fallback={<GenericPageSkeleton />}><TourHubEventPage /></Suspense>} />
        <Route path="/tourhub/rankings" element={<Suspense fallback={<GenericPageSkeleton />}><TourHubRankingsPage /></Suspense>} />
        <Route path="/tourhub/college-golf" element={<Suspense fallback={<GenericPageSkeleton />}><TourNavWrapper><CollegeGolfHubPage /></TourNavWrapper></Suspense>} />
        <Route path="/tourhub/college-golf/compare" element={<Suspense fallback={<GenericPageSkeleton />}><TourNavWrapper><CollegeComparePage /></TourNavWrapper></Suspense>} />
        <Route path="/tourhub/college-golf/:collegeSlug" element={<Suspense fallback={<GenericPageSkeleton />}><TourNavWrapper><CollegeProfilePage /></TourNavWrapper></Suspense>} />
        
        {/* Hub routes removed — redirects to clubhouse */}
        <Route path="/hub" element={<Navigate to="/clubhouse" replace />} />
        <Route path="/hub/*" element={<Navigate to="/clubhouse" replace />} />
        
        
        <Route path="*" element={<Suspense fallback={<GenericPageSkeleton />}><NotFound /></Suspense>} />
      </Routes>

      
      {/* Video Player Modal - rendered over origin page when navigating from video feed */}
      {showVideoModal && (
        <Suspense fallback={null}>
          <VideoPlayerModal />
        </Suspense>
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
      staleTime: 60_000, // 1 minute — safe fallback, never 0 at scale
      gcTime: 5 * 60 * 1000,
      refetchOnMount: false,
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
  // Global focus re-auth hook
  useReauthOnFocus();
  
  // Session start tracking
  useEffect(() => {
    const sessionId = crypto.randomUUID();
    sessionStorage.setItem('session_id', sessionId);
    analyticsEvents.track('session_start', {
      session_id: sessionId,
      referrer: document.referrer || 'direct',
    });
  }, []);
  
  // Enforce R2-only policy globally
  useImageUploadSafeguard();
  
  // Monitor global memory usage
  useGlobalMemoryMonitor(60000); // Check every minute
  
  // Warn on tab close during active uploads (P1-C)
  useUploadGuard();
  
  // Track user presence for nearby golfers feature
  usePresenceTracker();
  
  // Continuously broadcast location when visibility is active
  useLocationBroadcast();
  
// Listen for Top 100 XP notifications
  useTop100XpNotifications();
  
  // Real-time course ratings listener for instant card updates
  useCourseRatingsRealtime();
  
  // Bidirectional audio mute sync between MediaStore ↔ GlobalAudioContext
  useAudioBridge();
  
  // Register media cache service worker for persistent HLS segment caching
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/media-cache-sw.js', { scope: '/' })
        .catch(() => {});
    }
  }, []);
  // NOTE: useOnboardingEnforcer moved inside BrowserRouter (see OnboardingEnforcerWrapper below)
  
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
      <BrowserRouter>
        <HeaderProvider>
            <ModalProvider>
              <BottomNavigationProvider>
                
                  <UIProvider>
                    
                        <ActiveActorProvider>
                          
                          <ScrollToTop />
                          <ScrollRestoration />
                          <MediaSystemProvider>
                            <GlobalAudioProvider>
                              {/* REMOVED: FullscreenPlayerProvider — Phase 5 fullscreen system deleted */}
                                <TopTenProvider>
                                  <VideoPlaybackProvider>
                                      <ErrorBoundary>
                                        <AuthWrapper>
                                          <MessagingProvider>
                                          <UploadResilienceProvider>
                                            <SeasonWrapModal />
                                            <AchievementToastWrapper />
                                            <Suspense fallback={null}>
                                              <div className="app-depth">
                                                {/* Global header for all pages except Clubhouse/Auth/Admin */}
                                                <GlobalHeader />
                                                <AppRoutes />
                                              </div>
                                            </Suspense>
                                            {/* Mini Player - persists across navigation */}
                                            <Suspense fallback={null}>
                                              <MiniPlayer />
                                              <GlobalQueueDrawer />
                                            </Suspense>
                                            {/* Fullscreen Feed Overlay - portal-based, renders above everything */}
                                            <FullscreenFeedOverlay />
                                          </UploadResilienceProvider>
                                          </MessagingProvider>
                                        </AuthWrapper>
                                        <Sonner />
                                        <GlobalBottomNavigation />
                                        <GlobalPostStudio />
                                      </ErrorBoundary>
                                  </VideoPlaybackProvider>
                                </TopTenProvider>
                              {/* END REMOVED FullscreenPlayerProvider */}
                            </GlobalAudioProvider>
                          </MediaSystemProvider>
                        </ActiveActorProvider>
                    
                  </UIProvider>
                
              </BottomNavigationProvider>
            </ModalProvider>
          </HeaderProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
};

// App - Outer wrapper with QueryClientProvider
const App: React.FC = () => {
  // Import AppPrefetchProvider dynamically to avoid circular deps
  const AppPrefetchProvider = React.lazy(() => import('@/providers/AppPrefetchProvider'));
  
  return (
    <BetaAccessGate>
      <AppShell>
        <ReviewIslandLoader />
        <ThemeProvider defaultTheme="light" storageKey="clbhouz-ui-theme">
          <Top100DebugProvider>
            <QueryClientProvider client={queryClient}>
              <Suspense fallback={null}>
                <AppPrefetchProvider delay={2000} enabled={true}>
                  <RehydrationProvider>
                    <PostEventsBridge>
                      <UploadToastsBridge />
                      <UploadProgressBanner />
                      <AppInner />
                    </PostEventsBridge>
                  </RehydrationProvider>
                </AppPrefetchProvider>
              </Suspense>
            </QueryClientProvider>
          </Top100DebugProvider>
        </ThemeProvider>
      </AppShell>
    </BetaAccessGate>
  );
};

export default App;
