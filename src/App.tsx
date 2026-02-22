import React, { Suspense, lazy, useEffect, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
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
import { FullscreenPlayerProvider } from './contexts/FullscreenPlayerContext';
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
import { useLocationBroadcast } from '@/features/nearby/hooks/useLocationBroadcast';
import { TopTenProvider } from '@/context/TopTenContext';
import { VideoPlaybackProvider } from '@/context/VideoPlaybackContext';
import { ActiveActorProvider } from '@/context/ActiveActorContext';
import { Top100DebugProvider } from '@/context/Top100DebugContext';
import { UIProvider } from '@/contexts/UIContext';
import { ModalProvider } from '@/contexts/ModalContext';
import { BottomNavigationProvider } from '@/contexts/BottomNavigationContext';
import { CinemaDimProvider } from '@/contexts/CinemaDimContext';
import { PostEventsBridge } from '@/events/PostEventsBridge';
import { UploadToastsBridge } from '@/uploads/UploadToastsBridge';
import UploadProgressBanner from '@/components/uploads/UploadProgressBanner';
import GlobalBottomNavigation from '@/components/GlobalBottomNavigation';
import { UploadResilienceProvider } from '@/contexts/UploadResilienceContext';
import { FLAGS } from '@/config/flags';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { ClubhouseSkeleton } from '@/components/skeletons/ClubhouseSkeleton';
import { CourseDetailSkeleton } from '@/components/skeletons/CourseDetailSkeleton';
import { CoursesListSkeleton } from '@/components/skeletons/CoursesListSkeleton';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { DiscoverSkeleton } from '@/components/skeletons/DiscoverSkeleton';

import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';
import { AchievementsSkeleton } from '@/components/skeletons/AchievementsSkeleton';
import { ActivityPageSkeleton } from '@/components/skeletons/ActivityPageSkeleton';
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
import { useCourseRatingsRealtime } from '@/hooks/useCourseRatingsRealtime';



// Lazy-load ProfilePage and Discover for smaller initial bundle
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const Discover = lazy(() => import("./pages/Discover"));
import ErrorLogPage from "./pages/ErrorLogPage";
import { HeaderProvider } from '@/contexts/GlobalHeaderContext';
import GlobalHeader from '@/components/header/GlobalHeader';
import { KeepAliveOutlet } from '@/components/keep-alive/KeepAliveOutlet';


// Import wrapped components with explicit variants
import ClubhouseWrapped from "./pages/ClubhouseWrapped";
import DiscoverWrapped from "./pages/DiscoverWrapped";
import ProfileWrapped from "./pages/ProfileWrapped";
import SettingsWrapped from "./pages/SettingsWrapped";
import AuthWrapped from "./pages/AuthWrapped";
import { useModalContext } from '@/contexts/ModalContext';

// Lazy load other pages for better code splitting and loading screen experience
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/auth/AuthCallback"));
const VerifiedPage = lazy(() => import("./pages/auth/VerifiedPage"));
const Signup = lazy(() => import("./pages/Signup"));
const Clubhouse = lazy(() => import("./pages/Clubhouse"));
const AccountTypeOnboarding = lazy(() => import("./pages/onboarding/AccountTypeOnboarding"));
const ProfileTestPage = lazy(() => import("./pages/ProfileTestPage"));
const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));
const ProfileHandicapView = lazy(() => import("./pages/ProfileHandicapView"));
const ProfileQuestView = lazy(() => import("./pages/ProfileQuestView"));
const QuestIndexView = lazy(() => import("./pages/QuestIndexView"));
const QuestReplayView = lazy(() => import("./pages/QuestReplayView"));
const AdminBackfill = lazy(() => import("./pages/AdminBackfill"));
const UserReviewsPage = lazy(() => import("./pages/UserReviewsPage"));
// Old Settings page removed - now using SettingsPageV2 via SettingsWrapped
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage"));
const CourseReviewsPage = lazy(() => import("./pages/CourseReviewsPage"));
const RateCoursePage = lazy(() => import("./pages/RateCoursePage"));
const ShareReviewPage = lazy(() => import("./pages/ShareReviewPage"));
const UserCoursesPage = lazy(() => import("./pages/UserCoursesPage"));
const MyRatings = lazy(() => import("./pages/MyRatings"));
const JourneyListPage = lazy(() => import("./pages/JourneyListPage"));
const News = lazy(() => import("./pages/News"));

// Explore pages
const ExploreRegionPage = lazy(() => import("./pages/ExploreRegionPage"));
const ExploreThemePage = lazy(() => import("./pages/ExploreThemePage"));

const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ActivityPageWrapped = lazy(() => import("./pages/ActivityPageWrapped"));
const GolfersToFollowPage = lazy(() => import("./pages/GolfersToFollowPage"));
const GolfersSharedCoursesPage = lazy(() => import("./pages/GolfersSharedCoursesPage"));
const FriendsPage = lazy(() => import("./pages/FriendsPage"));
const FollowersPage = lazy(() => import("./pages/FollowersPage"));
const FollowingPage = lazy(() => import("./pages/FollowingPage"));
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
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminLanding = lazy(() => import("./pages/admin/AdminLanding").then(m => ({ default: m.AdminLanding })));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage").then(m => ({ default: m.AdminUsersPage })));
const AdminMembersPage = lazy(() => import("./pages/admin/AdminMembersPage").then(m => ({ default: m.AdminMembersPage })));
const AdminOverviewPage = lazy(() => import("./pages/admin/AdminOverviewPage").then(m => ({ default: m.AdminOverviewPage })));
const CommandCenterPage = lazy(() => import("./pages/admin/CommandCenterPage"));
const AdminInvitesPage = lazy(() => import("./pages/admin/AdminInvitesPage").then(m => ({ default: m.AdminInvitesPage })));
const InviteAcceptPage = lazy(() => import("./pages/admin/InviteAcceptPage").then(m => ({ default: m.InviteAcceptPage })));
const VerificationsPage = lazy(() => import("./pages/admin/VerificationsPage"));
const AdminBusinessDirectoryPage = lazy(() => import("./pages/admin/AdminBusinessDirectoryPage"));
const AdminAuditPage = lazy(() => import("./pages/admin/AdminAuditPage"));

// Legacy admin pages
const GolfCoursesPage = lazy(() => import("./pages/admin/GolfCoursesPage").then(m => ({ default: m.GolfCoursesPage })));
const GolfCourseEditorPage = lazy(() => import("./pages/admin/GolfCourseEditorPage"));
const LogosPage = lazy(() => import("./pages/admin/LogosPage").then(m => ({ default: m.LogosPage })));
const CollegeLogosPage = lazy(() => import("./pages/admin/CollegeLogosPage").then(m => ({ default: m.CollegeLogosPage })));
const CountryFlagsPage = lazy(() => import("./pages/admin/CountryFlagsPage").then(m => ({ default: m.CountryFlagsPage })));
const AssetManagerPage = lazy(() => import("./pages/admin/AssetManagerPage").then(m => ({ default: m.AssetManagerPage })));
const CourseImportPage = lazy(() => import("./pages/admin/CourseImportPage").then(m => ({ default: m.CourseImportPage })));
const AnalyticsPage = lazy(() => import("./pages/admin/AnalyticsPage").then(m => ({ default: m.AnalyticsPage })));
const AdminEchoAnalyticsPage = lazy(() => import("./features/admin/pages/AdminEchoAnalyticsPage").then(m => ({ default: m.AdminEchoAnalyticsPage })));
const AuthMonitoringPage = lazy(() => import("./pages/admin/AuthMonitoringPage"));
const TeamPage = lazy(() => import("./pages/admin/TeamPage").then(m => ({ default: m.TeamPage })));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage").then(m => ({ default: m.AdminSettingsPage })));
const Top100GeocodingPage = lazy(() => import("./pages/admin/Top100GeocodingPage").then(m => ({ default: m.Top100GeocodingPage })));
const AdminTestLabPage = lazy(() => import("./pages/admin/AdminTestLabPage"));
const AdminTourPage = lazy(() => import("./pages/admin/AdminTourPage").then(m => ({ default: m.AdminTourPage })));


const ChannelProfile = lazy(() => import("./pages/ChannelProfile"));
const GameDetailView = lazy(() => import("./features/game/GameDetailView"));

// Hub components (lazy load when feature flag is enabled)
const HubHomePage = lazy(() => import("./features/hub/pages/HubPageNew").then(m => ({ default: m.HubPageNew })));
const HubGolfersPage = lazy(() => import("./features/hub/pages/HubGolfersPage").then(m => ({ default: m.HubGolfersPage })));
const HubEchoChatPage = lazy(() => import("./features/hub/pages/HubEchoChatPage").then(m => ({ default: m.HubEchoChatPage })));

// Echo full-page experience
const EchoPage = lazy(() => import("./pages/EchoPage"));
const HubCreateGamePage = lazy(() => import("./features/hub/pages/HubCreateGamePage").then(m => ({ default: m.HubCreateGamePage })));
const HubGamesPage = lazy(() => import("./features/hub/pages/HubGamesPage").then(m => ({ default: m.HubGamesPage })));
const HubYourGamesPage = lazy(() => import("./features/hub/pages/HubYourGamesPage").then(m => ({ default: m.HubYourGamesPage })));
const HubMessagesListPage = lazy(() => import("./features/hub/pages/HubMessagesListPage").then(m => ({ default: m.HubMessagesListPage })));
const HubChatPlaceholderPage = lazy(() => import("./features/hub/pages/HubChatPlaceholderPage").then(m => ({ default: m.HubChatPlaceholderPage })));
const HubEchoHistoryPage = lazy(() => import("./features/hub/pages/HubEchoHistoryPage").then(m => ({ default: m.HubEchoHistoryPage })));
const HubEchoSharePage = lazy(() => import("./features/hub/pages/HubEchoSharePage").then(m => ({ default: m.HubEchoSharePage })));
const HubEchoTagsPage = lazy(() => import("./features/hub/pages/HubEchoTagsPage"));
const HubEchoHistoryDetailPage = lazy(() => import("./features/hub/pages/HubEchoHistoryDetailPage"));
const GameDetailPage = lazy(() => import("./features/hub/pages/GameDetailPage").then(m => ({ default: m.GameDetailPage })));
const TripDetailPage = lazy(() => import("./features/hub/pages/TripDetailPage").then(m => ({ default: m.TripDetailPage })));
const HubTripPage = lazy(() => import("./features/hub/pages/HubTripPage"));

// Games feature pages
const DiscoverGamesPage = lazy(() => import("./features/games/pages/DiscoverGamesPage"));

// Simple redirect component for /hub/game/:id → /game/:id
function HubGameRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/game/${id}`} replace />;
}

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

// Videos2 page
const VideosPage = lazy(() => import("./features/videos2/pages/VideosPage"));
// Video Player Modal (Phase 6A-1)
const VideoPlayerModal = lazy(() => import("./components/videos/VideoPlayerModal"));
const MiniPlayer = lazy(() => import("./components/videos/MiniPlayer"));
const GlobalQueueDrawer = lazy(() => import("./components/videos/GlobalQueueDrawer"));
const SeasonShop = lazy(() => import("./pages/SeasonShop"));
const ChallengesPage = lazy(() => import("./pages/ChallengesPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const BusinessDirectoryPage = lazy(() => import("./pages/BusinessDirectoryPage"));
const BusinessInsightsPage = lazy(() => import("./pages/BusinessInsightsPage"));
const BusinessInsightsPageV2 = lazy(() => import("./pages/BusinessInsightsPageV2"));
const BusinessProfilePage = lazy(() => import("./pages/BusinessProfilePage"));
const BusinessFollowersPage = lazy(() => import("./pages/BusinessFollowersPage"));
const MyBusinessesPage = lazy(() => import("./pages/MyBusinessesPage"));
const BusinessCreatePage = lazy(() => import("./pages/BusinessCreatePage"));
const BusinessIntroPage = lazy(() => import("./pages/BusinessIntroPage"));
const BusinessManagePage = lazy(() => import("./pages/BusinessManagePage"));
const BusinessEditWizard = lazy(() => import("./components/business/edit/BusinessEditWizard"));
const BusinessProfileLiveSuccessPage = lazy(() => import("./pages/BusinessProfileLiveSuccessPage"));
const BusinessVerificationAboutPage = lazy(() => import("./pages/BusinessVerificationAboutPage"));
const BusinessVerificationRequestPage = lazy(() => import("./pages/BusinessVerificationRequestPage"));
const BusinessVerificationSubmittedPage = lazy(() => import("./pages/BusinessVerificationSubmittedPage"));
const BusinessVerificationStatusPage = lazy(() => import("./pages/BusinessVerificationStatusPage"));
const BusinessDomainVerifyPage = lazy(() => import("./pages/BusinessDomainVerifyPage"));
const BusinessTeamPage = lazy(() => import("./pages/BusinessTeamPage"));
const BusinessInvitePage = lazy(() => import("./pages/BusinessInvitePage"));
const BusinessActivityPage = lazy(() => import("./pages/BusinessActivityPage"));
const ManageTeamPage = lazy(() => import("./pages/ManageTeamPage"));

const NotFound = lazy(() => import("./pages/NotFound"));
const CreateMomentPage = lazy(() => import("./pages/CreateMomentPage"));
const PostDeepLinkPage = lazy(() => import("./pages/PostDeepLinkPage"));

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
    { path: '/clubhouse', element: <ClubhouseWrapped /> },
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
        <Route path="/clubhouse" element={null} />
        
        <Route path="/auth" element={<AuthWrapped />} />
        <Route path="/auth/callback" element={<Suspense fallback={<GenericPageSkeleton />}><AuthCallback /></Suspense>} />
        <Route path="/auth/verified" element={<Suspense fallback={<GenericPageSkeleton />}><VerifiedPage /></Suspense>} />
        <Route path="/signup" element={<Suspense fallback={<GenericPageSkeleton />}><Signup /></Suspense>} />
        <Route path="/onboarding/account-type" element={<Suspense fallback={<GenericPageSkeleton />}><AccountTypeOnboarding /></Suspense>} />
        <Route path="/create-profile" element={<CreateProfileRedirect />} />
        <Route path="/profile" element={<ProfileWrapped />} />
        <Route path="/profile/handicap" element={<Suspense fallback={<ProfileSkeleton />}><ProfileHandicapView /></Suspense>} />
        <Route path="/profile/quest" element={<Suspense fallback={<ProfileSkeleton />}><ProfileQuestView /></Suspense>} />
        <Route path="/profile/quest/index" element={<Suspense fallback={<ProfileSkeleton />}><QuestIndexView /></Suspense>} />
        <Route path="/profile/quest/replay" element={<Navigate to="/achievements" replace />} />
        <Route path="/edit-profile" element={<Suspense fallback={<ProfileSkeleton />}><EditProfilePage /></Suspense>} />
        <Route path="/profile-test" element={<Suspense fallback={<ProfileSkeleton />}><ProfileTestPage /></Suspense>} />
        <Route path="/profile/:username" element={<ProfileWrapped />} />
        <Route path="/profile/:username/reviews" element={<Suspense fallback={<ProfileSkeleton />}><UserReviewsPage /></Suspense>} />
        <Route path="/settings" element={<SettingsWrapped />} />
        <Route path="/discover" element={<Suspense fallback={<DiscoverSkeleton />}><DiscoverWrapped /></Suspense>} />
        <Route path="/discover/explore/region/:slug" element={<Suspense fallback={<GenericPageSkeleton />}><ExploreRegionPage /></Suspense>} />
        <Route path="/discover/explore/theme/:slug" element={<Suspense fallback={<GenericPageSkeleton />}><ExploreThemePage /></Suspense>} />
        <Route path="/courses" element={<Suspense fallback={<CoursesListSkeleton />}><Courses /></Suspense>} />
        <Route path="/courses/:courseId" element={<Suspense fallback={<CourseDetailSkeleton />}><CourseDetailPage /></Suspense>} />
        <Route path="/courses/:courseId/rate" element={<Suspense fallback={<RateCoursePageSkeleton />}><RateCoursePage /></Suspense>} />
        <Route path="/courses/:courseId/share-review/:reviewId" element={<Suspense fallback={<GenericPageSkeleton />}><ShareReviewPage /></Suspense>} />
        <Route path="/courses/:courseId/reviews" element={<Suspense fallback={<CourseDetailSkeleton />}><CourseReviewsPage /></Suspense>} />
        <Route path="/user/:username/courses" element={<Suspense fallback={<CoursesListSkeleton />}><UserCoursesPage /></Suspense>} />
        <Route path="/my-ratings" element={<Suspense fallback={<CoursesListSkeleton />}><MyRatings /></Suspense>} />
        <Route path="/journey" element={<Suspense fallback={<CoursesListSkeleton />}><JourneyListPage /></Suspense>} />
        <Route path="/friends-activity" element={<Suspense fallback={<CoursesListSkeleton />}><FriendsActivityPage /></Suspense>} />
        <Route path="/news" element={<Suspense fallback={<GenericPageSkeleton />}><News /></Suspense>} />
        
        {/* Post deep link for notifications */}
        <Route path="/post/:postId" element={<Suspense fallback={null}><PostDeepLinkPage /></Suspense>} />
        
        <Route path="/videos" element={<Suspense fallback={<GenericPageSkeleton layout="grid" count={6} />}><VideosPage /></Suspense>} />
        <Route path="/video/:videoId" element={<Suspense fallback={null}><VideoPlayerModal /></Suspense>} />
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
        <Route path="/friends" element={<Suspense fallback={<GenericPageSkeleton />}><FriendsPage /></Suspense>} />
        <Route path="/followers" element={<Suspense fallback={<GenericPageSkeleton />}><FollowersPage /></Suspense>} />
        <Route path="/following" element={<Suspense fallback={<GenericPageSkeleton />}><FollowingPage /></Suspense>} />
        <Route path="/profile/:username/followers" element={<Suspense fallback={<GenericPageSkeleton />}><FollowersListPage /></Suspense>} />
        <Route path="/profile/:username/following" element={<Suspense fallback={<GenericPageSkeleton />}><FollowingListPage /></Suspense>} />
        <Route path="/profile/:username/friends" element={<Suspense fallback={<GenericPageSkeleton />}><FriendsListPage /></Suspense>} />
        
        {/* Business routes */}
        <Route path="/business-profiles" element={<Navigate to="/businesses/manage" replace />} />
        <Route path="/businesses/manage" element={<Suspense fallback={<GenericPageSkeleton />}><MyBusinessesPage /></Suspense>} />
        <Route path="/business/intro" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessIntroPage /></Suspense>} />
        <Route path="/business/create" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessCreatePage /></Suspense>} />
        <Route path="/business/manage" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessManagePage /></Suspense>} />
        <Route path="/business/insights" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessInsightsPage /></Suspense>} />
        <Route path="/business/:id/insights" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessInsightsPageV2 /></Suspense>} />
        <Route path="/business/:id/edit" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessEditWizard /></Suspense>} />
        <Route path="/business/success" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessProfileLiveSuccessPage /></Suspense>} />
        <Route path="/business/:id/verification/about" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessVerificationAboutPage /></Suspense>} />
        <Route path="/business/:id/verification/request" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessVerificationRequestPage /></Suspense>} />
        <Route path="/business/:id/verification/submitted" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessVerificationSubmittedPage /></Suspense>} />
        <Route path="/business/:id/verification/status" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessVerificationStatusPage /></Suspense>} />
        <Route path="/business/:businessId/verification/domain" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessDomainVerifyPage /></Suspense>} />
        <Route path="/business/:businessId/team" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessTeamPage /></Suspense>} />
        <Route path="/business/:businessId/team/invite" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessInvitePage /></Suspense>} />
        <Route path="/business/:businessId/manage-team" element={<Suspense fallback={<GenericPageSkeleton />}><ManageTeamPage /></Suspense>} />
        <Route path="/business/:businessId/activity" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessActivityPage /></Suspense>} />
        <Route path="/business/:idOrSlug/followers" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessFollowersPage /></Suspense>} />
        <Route path="/business/:idOrSlug" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessProfilePage /></Suspense>} />
        
        <Route path="/top100" element={<Suspense fallback={<CoursesListSkeleton />}><Top100Hub /></Suspense>} />
        <Route path="/top100/:slug" element={<Suspense fallback={<CoursesListSkeleton />}><Top100List /></Suspense>} />
        <Route path="/achievementshub" element={<Suspense fallback={<AchievementsSkeleton />}><AchievementsHubPage /></Suspense>} />
        <Route path="/achievements" element={<Suspense fallback={<AchievementsSkeleton />}><AchievementsPage /></Suspense>} />
        <Route path="/achievements/:userId" element={<Suspense fallback={<AchievementsSkeleton />}><AchievementsPage /></Suspense>} />
        <Route path="/admin-setup" element={<Suspense fallback={<GenericPageSkeleton />}><AdminSetupPage /></Suspense>} />
        
        {/* Admin routes wrapped with AdminLayout */}
        <Route path="/admin" element={<Suspense fallback={<GenericPageSkeleton />}><AdminLayout /></Suspense>}>
          <Route index element={<Suspense fallback={<GenericPageSkeleton />}><AdminLanding /></Suspense>} />
          <Route path="overview" element={
            <PanelGuard need="admins">
              <Suspense fallback={<GenericPageSkeleton />}><AdminOverviewPage /></Suspense>
            </PanelGuard>
          } />
          <Route path="command-center" element={
            <PanelGuard need="admins">
              <Suspense fallback={<GenericPageSkeleton />}><CommandCenterPage /></Suspense>
            </PanelGuard>
          } />
          <Route path="users" element={
            <PanelGuard need="users">
              <Suspense fallback={<GenericPageSkeleton />}><AdminUsersPage /></Suspense>
            </PanelGuard>
          } />
          <Route path="admins" element={
            <PanelGuard need="admins">
              <Suspense fallback={<GenericPageSkeleton />}><AdminMembersPage /></Suspense>
            </PanelGuard>
          } />
          <Route path="invites" element={
            <PanelGuard need="admins">
              <Suspense fallback={<GenericPageSkeleton />}><AdminInvitesPage /></Suspense>
            </PanelGuard>
          } />
          <Route path="verification" element={
            <PanelGuard need="admins">
              <Suspense fallback={<GenericPageSkeleton />}><VerificationsPage /></Suspense>
            </PanelGuard>
          } />
          {/* Redirect old route to new unified verification */}
          <Route path="business-verifications" element={<Navigate to="/admin/verification?type=businesses" replace />} />
          <Route path="businesses" element={
            <PanelGuard need="admins">
              <Suspense fallback={<GenericPageSkeleton />}><AdminBusinessDirectoryPage /></Suspense>
            </PanelGuard>
          } />
          <Route path="audit" element={
            <PanelGuard need="admins">
              <Suspense fallback={<GenericPageSkeleton />}><AdminAuditPage /></Suspense>
            </PanelGuard>
          } />
          
          {/* Legacy/management sections */}
          <Route path="golf-courses" element={<Suspense fallback={<GenericPageSkeleton />}><GolfCoursesPage /></Suspense>} />
          <Route path="assets" element={<Suspense fallback={<GenericPageSkeleton />}><AssetManagerPage /></Suspense>} />
          {/* Legacy routes - redirect to unified Asset Manager */}
          <Route path="logos" element={<Navigate to="/admin/assets" replace />} />
          <Route path="college-logos" element={<Navigate to="/admin/assets" replace />} />
          <Route path="country-flags" element={<Navigate to="/admin/assets" replace />} />
          <Route path="courses" element={<Suspense fallback={<GenericPageSkeleton />}><CourseImportPage /></Suspense>} />
          <Route path="analytics" element={
            <PanelGuard need="admins">
              <Suspense fallback={<GenericPageSkeleton />}><AnalyticsPage /></Suspense>
            </PanelGuard>
          } />
          <Route path="analytics/echo" element={
            <PanelGuard need="admins">
              <Suspense fallback={<GenericPageSkeleton />}><AdminEchoAnalyticsPage /></Suspense>
            </PanelGuard>
          } />
          <Route path="auth-monitoring" element={
            <PanelGuard need="admins">
              <Suspense fallback={<GenericPageSkeleton />}><AuthMonitoringPage /></Suspense>
            </PanelGuard>
          } />
          <Route path="team" element={<Suspense fallback={<GenericPageSkeleton />}><TeamPage /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<GenericPageSkeleton />}><AdminSettingsPage /></Suspense>} />
          <Route path="top100-geocoding" element={<Suspense fallback={<GenericPageSkeleton />}><Top100GeocodingPage /></Suspense>} />
          <Route path="tour" element={
            <PanelGuard need="admins">
              <Suspense fallback={<GenericPageSkeleton />}><AdminTourPage /></Suspense>
            </PanelGuard>
          } />
          <Route path="test-lab" element={
            <PanelGuard need="admins">
              <Suspense fallback={<GenericPageSkeleton />}><AdminTestLabPage /></Suspense>
            </PanelGuard>
          } />
        </Route>
        
        <Route path="/create-moment" element={<Suspense fallback={<GenericPageSkeleton />}><CreateMomentPage /></Suspense>} />
        <Route path="/error-logs" element={<ErrorLogPage />} />
        
        {/* TODO: Echo AI routes pending decommission — video players use legacy GlassVideo/HLSVideoPlayer outside standard video stack */}
        <Route path="/echo" element={<Suspense fallback={<HubSkeleton />}><EchoPage /></Suspense>} />
        <Route path="/echo/:conversationId" element={<Suspense fallback={<HubSkeleton />}><EchoPage /></Suspense>} />
        
        {/* Public Echo Share Page */}
        <Route path="/echo/share/:token" element={<Suspense fallback={<GenericPageSkeleton />}><EchoSharePage /></Suspense>} />
        
        {/* Golf Course Editor - full page routes outside AdminLayout */}
        <Route path="/admin/golf-courses/new" element={<Suspense fallback={<GenericPageSkeleton />}><GolfCourseEditorPage /></Suspense>} />
        <Route path="/admin/golf-courses/:id/edit" element={<Suspense fallback={<GenericPageSkeleton />}><GolfCourseEditorPage /></Suspense>} />
        
        <Route path="/admin/invite-accept" element={<Suspense fallback={<GenericPageSkeleton />}><InviteAcceptPage /></Suspense>} />
        <Route path="/admin-backfill" element={<Suspense fallback={<GenericPageSkeleton />}><AdminBackfill /></Suspense>} />

        <Route path="/channel/:slug" element={<Suspense fallback={<ProfileSkeleton />}><ChannelProfile /></Suspense>} />
        <Route path="/game/:id" element={<Suspense fallback={<GenericPageSkeleton />}><GameDetailView /></Suspense>} />
        
        {/* Games routes */}
        <Route path="/games/discover" element={<Suspense fallback={<GenericPageSkeleton />}><DiscoverGamesPage /></Suspense>} />
        <Route path="/nearby" element={<Navigate to="/games/discover" replace />} />
        
        {/* Tour Hub routes */}
        <Route path="/tourhub" element={<Suspense fallback={<GenericPageSkeleton />}><TourHubMainPage /></Suspense>} />
        <Route path="/tourhub/tournament/:tournamentId" element={<Suspense fallback={<GenericPageSkeleton />}><TournamentDetailPage /></Suspense>} />
        <Route path="/tourhub/player/:playerId" element={<Suspense fallback={<GenericPageSkeleton />}><PlayerProfilePage /></Suspense>} />
        <Route path="/tourhub/live" element={<Suspense fallback={<GenericPageSkeleton />}><TourHubLivePage /></Suspense>} />
        <Route path="/tourhub/tour/:tour" element={<Suspense fallback={<GenericPageSkeleton />}><TourHubTourPage /></Suspense>} />
        <Route path="/tourhub/event/:tour/:eventId" element={<Suspense fallback={<GenericPageSkeleton />}><TourHubEventPage /></Suspense>} />
        <Route path="/tourhub/rankings" element={<Suspense fallback={<GenericPageSkeleton />}><TourHubRankingsPage /></Suspense>} />
        <Route path="/tourhub/college-golf" element={<Suspense fallback={<GenericPageSkeleton />}><TourNavWrapper><CollegeGolfHubPage /></TourNavWrapper></Suspense>} />
        <Route path="/tourhub/college-golf/compare" element={<Suspense fallback={<GenericPageSkeleton />}><TourNavWrapper><CollegeComparePage /></TourNavWrapper></Suspense>} />
        <Route path="/tourhub/college-golf/:collegeSlug" element={<Suspense fallback={<GenericPageSkeleton />}><TourNavWrapper><CollegeProfilePage /></TourNavWrapper></Suspense>} />
        
        {/* Hub routes - standard pages */}
        <Route path="/hub" element={<Suspense fallback={<HubSkeleton />}><HubHomePage /></Suspense>} />
        <Route path="/hub/golfers" element={<Suspense fallback={<HubSkeleton />}><HubGolfersPage /></Suspense>} />
        <Route path="/hub/echo" element={<Suspense fallback={<HubSkeleton />}><HubEchoChatPage /></Suspense>} />
        <Route path="/hub/create-game" element={<Suspense fallback={<HubSkeleton />}><HubCreateGamePage /></Suspense>} />
        <Route path="/hub/games" element={<Suspense fallback={<HubSkeleton />}><HubGamesPage /></Suspense>} />
        <Route path="/hub/games/:gameId" element={<Suspense fallback={<HubSkeleton />}><GameDetailPage /></Suspense>} />
        <Route path="/hub/trips/:tripId" element={<Suspense fallback={<HubSkeleton />}><TripDetailPage /></Suspense>} />
        <Route path="/hub/your-games" element={<Suspense fallback={<HubSkeleton />}><HubYourGamesPage /></Suspense>} />
        <Route path="/hub/messages" element={<Suspense fallback={<HubSkeleton />}><HubMessagesListPage /></Suspense>} />
        <Route path="/hub/messages/:conversationId" element={<Suspense fallback={<HubSkeleton />}><HubChatPlaceholderPage /></Suspense>} />
        <Route path="/hub/echo/history" element={<Suspense fallback={<HubSkeleton />}><HubEchoHistoryPage /></Suspense>} />
        <Route path="/hub/echo/history/chat/:id" element={<Suspense fallback={<HubSkeleton />}><HubEchoHistoryDetailPage /></Suspense>} />
        <Route path="/hub/echo/tags" element={<Suspense fallback={<HubSkeleton />}><HubEchoTagsPage /></Suspense>} />
        <Route path="/echo/share/:token" element={<Suspense fallback={<HubSkeleton />}><HubEchoSharePage /></Suspense>} />
        <Route path="/hub/new" element={<Navigate to="/hub/echo/history" replace />} />
        <Route path="/hub/trip/:tripId" element={<Suspense fallback={<HubSkeleton />}><HubTripPage /></Suspense>} />
        {/* Redirect /hub/game/:id to /game/:id */}
        <Route path="/hub/game/:id" element={<HubGameRedirect />} />
        
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
  
  // Real-time course ratings listener for instant card updates
  useCourseRatingsRealtime();
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
                <CinemaDimProvider>
                  <UIProvider>
                    <ToastHost>
                      <HubProvider>
                        <ActiveActorProvider>
                          
                          <ScrollToTop />
                          <ScrollRestoration />
                          <MediaSystemProvider>
                            <GlobalAudioProvider>
                              <FullscreenPlayerProvider>
                                {/* RETIRED: VideoManagerProvider + VideoPlaybackManagerProvider removed */}
                                {/* All playback control is now centralized in MediaSystemProvider */}
                                <TopTenProvider>
                                  <VideoPlaybackProvider>
                                      <ErrorBoundary>
                                        <AuthWrapper>
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
                                          </UploadResilienceProvider>
                                        </AuthWrapper>
                                      </ErrorBoundary>
                                  </VideoPlaybackProvider>
                                </TopTenProvider>
                              </FullscreenPlayerProvider>
                            </GlobalAudioProvider>
                          </MediaSystemProvider>
                          <Toaster />
                          <Sonner />
                          <GlobalBottomNavigation />
                        </ActiveActorProvider>
                      </HubProvider>
                    </ToastHost>
                  </UIProvider>
                </CinemaDimProvider>
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
