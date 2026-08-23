import React, { Suspense, useEffect, useLayoutEffect, useMemo } from "react";
import { trackedLazy } from '@/perf/navTiming';
// Shadow React.lazy so EVERY route-level lazy import is automatically tracked
// for nav-timing chunk-fetch ms. trackedLazy falls back to React.lazy when
// perf is disabled (production without ?perf=1).
const lazy = <T extends { default: React.ComponentType<any> }>(factory: () => Promise<T>) =>
  trackedLazy('route', factory);
import { usePageTracking } from '@/hooks/usePageTracking';
import { useFullScreenSurface } from '@/stores/fullScreenSurfaceStore';


import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import 'mapbox-gl/dist/mapbox-gl.css';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryPersister, shouldPersistQuery, PERSIST_MAX_AGE_MS } from "@/lib/queryPersister";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams, useNavigate, type Location as RouterLocation } from "react-router-dom";
import { setNavigateRef, appNavigate } from '@/utils/navigation';
import ScrollToTop from '@/components/ScrollToTop';
import { WATCH_SURFACE } from '@/config/featureFlags';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { ScrollRestoration } from '@/components/ScrollRestoration';
import { LockAnchorSync } from '@/components/LockAnchorSync';
import { ThemeProvider } from '@/components/theme-provider';

import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { MaintenanceGate } from "@/components/maintenance/MaintenanceGate";
import AuthWrapper from "@/components/auth/AuthWrapper";
import DeletedAccountGate from "@/components/DeletedAccountGate";
import BootHold from "@/components/BootHold";

// REMOVED: FullscreenPlayerProvider — Phase 5 fullscreen system deleted
import { RehydrationProvider } from './contexts/RehydrationContext';
// RETIRED: VideoManagerProvider, VideoPlaybackManagerProvider, MediaSystemProvider.
// Video engine severed — playback is poster-only across every surface.
// [VIDEO-TEARDOWN] hlsLoader boot import removed — engine severed.

import { useImageUploadSafeguard } from '@/hooks/useImageUploadSafeguard';
import { useGlobalMemoryMonitor } from '@/hooks/useMemoryMonitor';
import { usePresenceTracker } from '@/hooks/usePresenceTracker';
// Removed: useLocationBroadcast — nearby/location feature retired
import { TopTenProvider } from '@/context/TopTenContext';
import { VideoPlaybackProvider } from '@/context/VideoPlaybackContext';
import { ActiveActorProvider } from '@/context/ActiveActorContext';
import { Top100DebugProvider } from '@/context/Top100DebugContext';
import { UIProvider } from '@/contexts/UIContext';
import { ModalProvider } from '@/contexts/ModalContext';
import { BottomNavigationProvider } from '@/contexts/BottomNavigationContext';

import { PostEventsBridge } from '@/events/PostEventsBridge';
import { UploadToastsBridge } from '@/uploads/UploadToastsBridge';
import { PendingPostsController } from '@/uploads/PendingPostsController';
import UploadProgressBanner from '@/components/uploads/UploadProgressBanner';
import GlobalBottomNavigation from '@/components/GlobalBottomNavigation';
import { GlobalPostComposer } from '@/components/post-composer/GlobalPostComposer';
import { FullscreenFeedOverlay } from '@/components/fullscreen-feed/FullscreenFeedOverlay';
import { ReviewBottomSheetPortal } from '@/components/posts/ReviewBottomSheetPortal';
import { RequestCourseSheetHost } from '@/components/courses/RequestCourseSheetHost';



import { FriendSheetProvider } from '@/components/friend-sheet/FriendSheetProvider';
import { InviteSheetProvider } from '@/components/invite/InviteSheetProvider';
import { useUploadGuard } from '@/hooks/useUploadGuard';
import { FLAGS } from '@/config/flags';
import { FEATURE_FLAGS } from '@/config/featureFlags';

import { CourseDetailSkeleton } from '@/components/skeletons/CourseDetailSkeleton';
import { CoursesListSkeleton } from '@/components/skeletons/CoursesListSkeleton';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { ManagePageSkeleton } from '@/components/skeletons/ManagePageSkeleton';
import { HandicapPageSkeleton } from '@/components/skeletons/HandicapPageSkeleton';
import { CoursesHubSkeleton } from '@/components/skeletons/CoursesHubSkeleton';
import DiscoverCourseLedSkeleton from '@/components/explore-tab-new/courseled/DiscoverCourseLedSkeleton';


import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';
import StageLoadingShell from '@/features/post-v2/StageLoadingShell';
import { PlayerPageSkeleton } from '@/components/skeletons/PlayerPageSkeleton';
import { TournamentPageSkeleton } from '@/components/skeletons/TournamentPageSkeleton';
import { CollegeHubSkeleton } from '@/components/skeletons/CollegeHubSkeleton';
import { TourHubOverviewSkeleton } from '@/components/skeletons/TourHubOverviewSkeleton';
import { WatchHubSkeleton, WatchClipsSkeleton, WatchVideosSkeleton } from '@/components/skeletons/WatchSkeletons';
import { AchievementsSkeleton } from '@/components/skeletons/AchievementsSkeleton';
import { ActivityPageSkeleton } from '@/components/skeletons/ActivityPageSkeleton';
import { HubSkeleton } from '@/components/skeletons/HubSkeleton';
import { RateCoursePageSkeleton } from '@/components/skeletons/RateCoursePageSkeleton';
import { initRecentMediaListener } from '@/hooks/usePostSubmission/recentMediaListener';
import { longPressHandler } from '@/utils/longPressHandler';
import AppShell from '@/components/AppShell';
import { forceUnlockBodyScroll } from '@/lib/bodyScrollLock';
import { ReviewIslandLoader } from '@/ReviewIslandLoader';
import { supabase } from '@/integrations/supabase/client';
import { migrateChatHistory } from '@/utils/chatHistoryMigration';
import { NavTimingProvider } from '@/perf/NavTimingProvider';
import { AdminGatedPerfPill, AdminGatedBootTimelinePill, AdminGatedPerfHud, AdminGatedLogHud, AdminGatedAudioLogsButton, AdminGatedAudioDebugHud } from '@/perf/AdminGatedPills';








import { AchievementToastContainer } from '@/components/achievements/AchievementToastContainer';

import { LevelUpGate } from '@/components/achievements/LevelUpGate';
import { useAchievementSharing } from '@/hooks/useAchievementSharing';
import { useTop100XpNotifications } from '@/hooks/useTop100XpNotifications';
import { useCourseRatingsRealtime } from '@/hooks/useCourseRatingsRealtime';



// Lazy-load Discover for smaller initial bundle
const Discover = lazy(() => import("./pages/Discover"));
import ErrorLogPage from "./pages/ErrorLogPage";
import { HeaderProvider } from '@/contexts/GlobalHeaderContext';
import GlobalHeader from '@/components/header/GlobalHeader';
import { applyRouteChrome } from '@/lib/routeChrome';
import { KeepAliveOutlet } from '@/components/keep-alive/KeepAliveOutlet';


// Import wrapped components with explicit variants
import ClubhouseWrapped from "./pages/ClubhouseWrapped";
import { UserStatsCoursesProvider } from "@/contexts/UserStatsCoursesContext";


import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { useSuspensionStatus } from "@/hooks/useSuspensionStatus";
import SuspendedScreen from "@/components/SuspendedScreen";

import { isNativeAppSync, isPreviewHost, waitForNativeBridge } from '@/utils/native/isNativeApp';
import AppDownloadGate from '@/pages/AppDownloadGate';
import { isGateExemptPath } from '@/pages/gate/gateRoutes';
import { useEnvStatus, isAppShellVisible } from '@/utils/native/envStatus';

// ── Median push deep-link bridge ────────────────────────────────────────
// Median's JS Bridge calls this global function when a push notification is
// opened, passing the OneSignal Additional Data. Registered at module scope
// so it exists on `window` BEFORE any cold-start tap dispatches - the
// listener must be ready regardless of OneSignal registration timing.
if (typeof window !== 'undefined') {
  (window as any).median_onesignal_push_opened = (payload: any) => {
    try {
      const d =
        payload?.additionalData ??
        payload?.notification?.additionalData ??
        payload?.data ??
        payload ??
        {};
      const target =
        (typeof d?.route === 'string' && d.route) ||
        (typeof d?.targetUrl === 'string' && d.targetUrl) ||
        null;
      if (!target) return;
      const path = target.startsWith('http')
        ? new URL(target).pathname + new URL(target).search + new URL(target).hash
        : target;
      // Defer a tick so router is ready on cold start.
      setTimeout(() => { appNavigate(path); }, 0);
    } catch { /* swallow */ }
  };
}


const RootGate: React.FC = () => {
  const { user, loading: authLoading } = useSupabaseSession();
  const suspension = useSuspensionStatus(user?.id);
  const location = useLocation();
  const isActive = location.pathname === '/';

  // Native / preview status is decided ONCE per session (shared store —
  // `useEnvStatus` above). RootGate reflects it here; GlobalHeader and
  // GlobalBottomNavigation read the same store to skip mounting while the
  // gate holds or the web gate is showing.
  const envStatus = useEnvStatus();

  if (envStatus === 'pending') return <BootHold />;
  if (envStatus === 'web') return <AppDownloadGate />;

  if (authLoading) return <BootHold />;
  if (!user) return isActive ? <Navigate to="/auth" replace /> : null;

  if (suspension.status === 'suspended') {
    return <SuspendedScreen suspension={suspension.suspension} />;
  }

  return <ClubhouseWrapped />;
};


/** Renders app chrome (header/bottom-nav) only when the gate has resolved
 *  to the real app shell. Prevents chrome from flashing under BootHold or
 *  the AppDownloadGate on cold web loads. */
const AppShellOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const envStatus = useEnvStatus();
  if (!isAppShellVisible(envStatus)) return null;
  return <>{children}</>;
};

import CoursesWrapped from "./pages/CoursesWrapped";
import ProfileWrapped from "./pages/ProfileWrapped";

import AuthWrapped from "./pages/AuthWrapped";
import { useModalContext } from '@/contexts/ModalContext';

// Lazy load other pages for better code splitting and loading screen experience
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/auth/AuthCallback"));
const Signup = lazy(() => import("./pages/Signup"));
const Clubhouse = lazy(() => import("./pages/Clubhouse"));

const HomeLanding = lazy(() => import("./pages/HomeLanding"));


const WatchHubV2 = lazy(() => import("./features/watch-v2/WatchHubV2"));
const VideosPageV2 = lazy(() => import("./features/videos-v2/VideosPageV2"));
const ClipsPageV2 = lazy(() => import("./features/clips-v2/ClipsPageV2"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));




const ManageProfilePage = lazy(() => import("./pages/ManageProfile"));
const ManageEmailPage = lazy(() => import("./pages/manage/EmailPage"));
const ManageBlockedPage = lazy(() => import("./pages/manage/BlockedPage"));
const ManageNotificationsPage = lazy(() => import("./pages/manage/NotificationsPage"));
const ManageHelpPage = lazy(() => import("./pages/manage/HelpPage"));
const ManageContactPage = lazy(() => import("./pages/manage/ContactPage"));
const ManageMyRequestsPage = lazy(() => import("./pages/manage/MyRequestsPage"));
const SupportThreadPage = lazy(() => import("./pages/manage/SupportThreadPage"));
const ManageLegalPage = lazy(() => import("./pages/manage/LegalPage"));
const ManageHandicapPage = lazy(() => import("./pages/manage/HandicapManagePage"));
// ProfileHandicapView removed — /profile/handicap now redirects to /handicap (fix brief §2.1)
const HandicapPage = lazy(() => import("./pages/HandicapPage"));
const RivalryCompareRedirect = lazy(() => import("./pages/RivalryCompareRedirect"));


// Legacy quest/user-reviews pages removed — routes below redirect.
const UserReviewsRedirect: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  return <Navigate to={username ? `/profile/${username}` : '/'} replace />;
};

// Courses page now uses CoursesWrapped (imported above) which handles header/dim reset
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage"));
const CourseReviewsPage = lazy(() => import("./pages/CourseReviewsPage"));
const ReviewComposerV2 = lazy(() => import("./features/review-v2/ReviewComposerV2"));
const PostV2Page = lazy(() => import("./features/post-v2/PostV2Page"));

// ShareReviewPage removed in PR-5 Part 2 (zero navigators — orphan preview surface, ReviewWizard shares inline).
const UserCoursesPage = lazy(() => import("./pages/UserCoursesPage"));
const CommunityPage = lazy(() => import("./features/community/CommunityPage"));



const News = lazy(() => import("./pages/News"));




const InboxV2Page = lazy(() => import("./pages/messaging-v2/InboxV2Page"));
const ThreadV2Page = lazy(() => import("./pages/messaging-v2/ThreadV2Page"));
const MessagingShell = lazy(() => import("./pages/messaging-v2/MessagingShell"));

const ActivityPageV2 = lazy(() => import("./features/activity-v2/ActivityPageV2"));
const GolfersToFollowV2 = lazy(() => import("./pages/GolfersToFollowV2"));
const OwnProfileSocialRedirect = lazy(() => import("./components/profile/OwnProfileSocialRedirect"));
const FriendsRedirectToFollowing = lazy(() => import("./pages/FriendsRedirectToFollowing"));
const ProfileSocialListRoute = lazy(() => import("./features/social-lists-v2/ProfileSocialListRoute"));
const BusinessSocialListRoute = lazy(() => import("./features/social-lists-v2/BusinessSocialListRoute"));


const CreateProfileRedirect = lazy(() => import("./components/redirects/CreateProfileRedirect"));




const AdminSetupPage = lazy(() => import("./pages/AdminSetupPage"));
const AdminShell = lazy(() => import('./features/admin/AdminShell'));




// Removed: GameDetailView lazy import — /game/:id now redirects to /clubhouse

// Hub lazy imports removed — Hub page decommissioned

// Echo v2 full-page experience
const EchoV2Page = lazy(() => import("./pages/EchoV2Page"));

const EchoHistoryPage = lazy(() => import("./pages/EchoHistoryPage"));

// Removed: DiscoverGamesPage lazy import — /games/discover now redirects to /clubhouse


// Tour Hub pages
const TourHubMainPage = lazy(() => import("./features/tourhub/pages").then(m => ({ default: m.TourHubMainPage })));

const TournamentDetailPage = lazy(() => import("./features/tourhub/tournament-v2/TournamentPage").then(m => ({ default: m.TournamentPage })));
const PlayerProfilePage = lazy(() => import("./features/tourhub/player-v2/PlayerPage").then(m => ({ default: m.PlayerPage })));
const CollegeGolfHubPage = lazy(() => import("./features/tourhub/college-v2/hub/CollegeHubPage").then(m => ({ default: m.CollegeHubPage })));
const CollegeProfilePage = lazy(() => import("./features/tourhub/college-v2/profile/CollegeProfilePage").then(m => ({ default: m.CollegeProfilePage })));
const CollegeComparePage = lazy(() => import("./features/tourhub/college-v2/compare/ComparePage").then(m => ({ default: m.ComparePage })));


// Continue Watching mini-player (queue drawer + full-screen modal deleted in PR-5).
const MiniPlayer = lazy(() => import("./components/videos/MiniPlayer"));

// PR-5: /video/:videoId is a post-id deep link. Preserve old shared links via unified /post viewer.
const VideoIdToPostRedirect: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  return <Navigate to={videoId ? `/post/${videoId}` : '/explore'} replace />;
};

// Watch surface hibernation gate. When WATCH_SURFACE is false the dormant
// routes stay registered but bounce to /explore, and we record the attempt so
// we can tell whether anyone is still trying to reach them.
const WatchGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const dormant = !WATCH_SURFACE;
  useEffect(() => {
    if (dormant) analyticsEvents.track('watch_redirect_hit', { path: location.pathname });
  }, [dormant, location.pathname]);
  if (dormant) return <Navigate to="/explore" replace />;
  return <>{children}</>;
};

const EchoV2Redirect: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  return <Navigate to={chatId ? `/echo/${chatId}` : '/echo'} replace />;
};
const ReviewComposerRoute: React.FC = () => (
  <Suspense fallback={<RateCoursePageSkeleton />}>
    <ReviewComposerV2 />
  </Suspense>
);

const ReviewComposerOverlay: React.FC = () => {
  // In-tree full-screen surface — body-level affordances stand down.
  useFullScreenSurface();
  return (
  <div
    role="dialog"
    aria-modal="true"
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      background: '#F8FAFC',
    }}
  >
    <ReviewComposerRoute />
  </div>
  );
};


const BusinessDirectoryPage = lazy(() => import("./pages/BusinessDirectoryPage"));
const BusinessInsightsPageV2 = lazy(() => import("./pages/BusinessInsightsPageV2"));
const ClubAnalyticsPage = lazy(() => import("./pages/ClubAnalyticsPage"));
const BusinessProfilePage = lazy(() => import("./pages/BusinessProfilePage"));

const MyBusinessesPage = lazy(() => import("./pages/MyBusinessesPage"));
const BusinessProfileEditor = lazy(() => import("./pages/BusinessProfileEditor"));


const BusinessProfileLiveSuccessPage = lazy(() => import("./pages/BusinessProfileLiveSuccessPage"));
const BusinessVerificationPage = lazy(() => import("./pages/BusinessVerificationPage"));
const BusinessTeamPage = lazy(() => import("./pages/BusinessTeamPage"));
const BusinessInvitePage = lazy(() => import("./pages/BusinessInvitePage"));
const BusinessInviteAcceptPage = lazy(() => import("./pages/BusinessInviteAcceptPage"));
const BusinessActivityPage = lazy(() => import("./pages/BusinessActivityPage"));
const BusinessReviewsPage = lazy(() => import("./pages/BusinessReviewsPage"));



const NotFound = lazy(() => import("./pages/NotFound"));
const JoinLandingPage = lazy(() => import("./pages/public/JoinLandingPage"));
const InviteLandingPage = lazy(() => import("./pages/public/InviteLandingPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/legal/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/legal/TermsPage"));
const LegalDocumentPage = lazy(() => import("./pages/legal/LegalDocumentPage"));


// PostsTabTestPage removed — Posts tab now integrated into profiles
// CreateMomentPage removed — PostStudio is now the sole creation flow
const PostDeepLinkPage = lazy(() => import("./pages/PostDeepLinkPage"));
const CommentDeepLinkPage = lazy(() => import("./features/comments-v2/CommentDeepLinkV2"));

// Import season wrap modal
import { SeasonWrapModal } from '@/components/season/SeasonWrapModal';
import { InAppNotificationsMount } from '@/components/notifications/InAppNotificationsMount';
import { GenderPromptSheet } from '@/components/profile/GenderPromptSheet';

import { useSilentSwitchHint } from '@/audio/useSilentSwitchHint';



// Creator routes removed - now handled via Business Creator profiles or Personal Creator Mode


// Component to set navigate ref for use outside React components
function NavigationRefSetter() {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    setNavigateRef(navigate, location);
  }, [navigate, location]);

  return null;
}

// Routes component that handles background location pattern for Hub overlays and Video modal
function AppRoutes() {
  usePageTracking();
  const location = useLocation();
  const state = location.state as { backgroundLocation?: RouterLocation; fromHub?: boolean; fromVideo?: boolean } | null;
  const { shouldHideHeader } = useModalContext();

  // [VPERF] page tag — feeds every emit so metrics are comparable across pages.
  useEffect(() => {
    const p = location.pathname;
    const page =
      p === '/' || p === '/clubhouse' ? 'clubhouse'
      : p.startsWith('/watch') ? 'watch'
      : p === '/explore' ? 'discover'
      : p.startsWith('/discover') ? 'discover'

      : p.startsWith('/courses') ? 'courses'
      : p.startsWith('/profile') ? 'profile'
      : p.startsWith('/tour') ? 'tourhub'
      : p.split('/')[1] || 'root';
    import('@/perf/vperf').then((m) => m.vperfSetPage(page)).catch(() => {});
  }, [location.pathname]);
  
  // BUG-1 FIX (flicker pass): the previous baseline `shield = transparent` step
  // was removed — it exposed the raw #0d0d0d .app-shell background for a frame
  // between reset and the final applyShieldColor() below. The effect ends by
  // calling applyShieldColor(...) with the correct route value, so cold boot
  // still lands on a real colour (initial `transparent` comes from index.html).
  //
  // AppRoutes is now the SOLE writer of shield / html+body bg / route classes /
  // native status bar (single-writer consolidation). Idempotency cache below
  // makes unchanged navs skip every DOM + bridge call — most navs share chrome.
  useLayoutEffect(() => {
    // Safety net: release any stranded body scroll-lock from an overlay that
    // didn't unmount cleanly before route change.
    forceUnlockBodyScroll();
    applyRouteChrome(location.pathname);
  }, [location.pathname]);

  
  // Render origin page when we have a background location
  const routesLocation = state?.backgroundLocation || location;
  
  // Video full-screen modal deleted in PR-5 (queue family strip).
  const overlayActive = shouldHideHeader;
  
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
    { path: '/', element: <RootGate /> },
  ], []);

  const webEnvStatus = useEnvStatus();

  // Web gate: on the web the app shell never mounts. Every path resolves to
  // the AppDownloadGate except the exempt list (see gateRoutes.ts) — most
  // importantly /post/:postId, which keeps its real logged-out preview.
  if (webEnvStatus === 'pending') return <BootHold />;
  if (webEnvStatus === 'web' && !isGateExemptPath(location.pathname)) {
    return <AppDownloadGate />;
  }


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
        <Route path="/auth/callback" element={<Suspense fallback={<BootHold />}><AuthCallback /></Suspense>} />
        <Route path="/signup" element={<Suspense fallback={<GenericPageSkeleton />}><Signup /></Suspense>} />
        <Route path="/onboarding/account-type" element={<Navigate to="/edit-profile?onboarding=1" replace />} />
        <Route path="/create-profile" element={<CreateProfileRedirect />} />
        <Route path="/profile" element={<ProfileWrapped />} />
        <Route path="/profile/handicap" element={<Navigate to="/handicap" replace />} />
        <Route path="/handicap" element={<Suspense fallback={<HandicapPageSkeleton />}><HandicapPage /></Suspense>} />
        <Route path="/handicap/legends" element={<Navigate to="/handicap?subtab=circle" replace />} />
        
        <Route path="/handicap/rivalry/:rivalUserId" element={<Suspense fallback={<HandicapPageSkeleton />}><RivalryCompareRedirect /></Suspense>} />
        <Route path="/handicap/:userId" element={<Suspense fallback={<HandicapPageSkeleton />}><HandicapPage /></Suspense>} />
        <Route path="/handicap/:friendUserId/rivalry/:rivalUserId" element={<Suspense fallback={<HandicapPageSkeleton />}><RivalryCompareRedirect /></Suspense>} />


        
        <Route path="/profile/quest" element={<Navigate to="/handicap" replace />} />
        <Route path="/profile/quest/index" element={<Navigate to="/handicap" replace />} />
        <Route path="/profile/quest/replay" element={<Navigate to="/handicap" replace />} />
        <Route path="/edit-profile" element={<Suspense fallback={<ManagePageSkeleton />}><ManageProfilePage /></Suspense>} />
        <Route path="/manage/email" element={<Suspense fallback={<ManagePageSkeleton />}><ManageEmailPage /></Suspense>} />
        <Route path="/manage/blocked" element={<Suspense fallback={<ManagePageSkeleton />}><ManageBlockedPage /></Suspense>} />
        <Route path="/manage/notifications" element={<Suspense fallback={<ManagePageSkeleton />}><ManageNotificationsPage /></Suspense>} />
        <Route path="/manage/help" element={<Suspense fallback={<ManagePageSkeleton />}><ManageHelpPage /></Suspense>} />
        <Route path="/manage/contact" element={<Suspense fallback={<ManagePageSkeleton />}><ManageContactPage /></Suspense>} />
        <Route path="/manage/requests" element={<Suspense fallback={<ManagePageSkeleton />}><ManageMyRequestsPage /></Suspense>} />
        <Route path="/support/thread/:id" element={<Suspense fallback={<ManagePageSkeleton />}><SupportThreadPage /></Suspense>} />
        <Route path="/manage/legal" element={<Suspense fallback={<ManagePageSkeleton />}><ManageLegalPage /></Suspense>} />
        <Route path="/manage/handicap" element={<Suspense fallback={<ManagePageSkeleton />}><ManageHandicapPage /></Suspense>} />


        
        
        <Route path="/profile/:username" element={<ProfileWrapped />} />
        <Route path="/profile/:username/reviews" element={<UserReviewsRedirect />} />
        
        
        {/* Watch surface is dormant (WATCH_SURFACE=false): routes stay registered
            and redirect to /explore so shared links never hard-404. */}
        <Route path="/watch" element={<WatchGate><Suspense fallback={<WatchHubSkeleton />}><WatchHubV2 /></Suspense></WatchGate>} />
        <Route path="/videos" element={<WatchGate><Navigate to="/watch" replace /></WatchGate>} />
        <Route path="/clips" element={<WatchGate><Navigate to="/watch/clips" replace /></WatchGate>} />
        <Route path="/watch/clips" element={<WatchGate><Suspense fallback={<WatchClipsSkeleton />}><ClipsPageV2 /></Suspense></WatchGate>} />
        <Route path="/watch/videos" element={<WatchGate><Suspense fallback={<WatchVideosSkeleton />}><VideosPageV2 /></Suspense></WatchGate>} />
        <Route path="/explore" element={<Suspense fallback={<DiscoverCourseLedSkeleton />}><ExplorePage /></Suspense>} />

        <Route path="/courses" element={<Suspense fallback={<CoursesHubSkeleton />}><CoursesWrapped /></Suspense>} />
        <Route path="/courses/:courseId" element={<Suspense fallback={<CourseDetailSkeleton />}><CourseDetailPage /></Suspense>} />

        <Route path="/courses/:courseId/rate" element={<ReviewComposerRoute />} />
        <Route path="/rate-course-v2/:courseId" element={<ReviewComposerRoute />} />
        <Route path="/post-v2" element={<Suspense fallback={<StageLoadingShell />}><PostV2Page /></Suspense>} />
        
        {/* /courses/:courseId/share-review/:reviewId removed in PR-5 Part 2 — orphan surface. ReviewWizard shares inline. */}
        <Route path="/courses/:courseId/reviews" element={<Suspense fallback={<CourseDetailSkeleton />}><CourseReviewsPage /></Suspense>} />
        <Route path="/user/:username/courses" element={<Suspense fallback={<CoursesListSkeleton />}><UserCoursesPage /></Suspense>} />
        
        {/* Community — the destination that replaced the moments see-all sheet. */}
        <Route path="/community" element={<Suspense fallback={<GenericPageSkeleton />}><CommunityPage /></Suspense>} />

        <Route path="/journey" element={<Navigate to="/courses" replace />} />
        
        <Route path="/friends-activity" element={<Navigate to="/courses" replace />} />
        <Route path="/news" element={<Suspense fallback={<GenericPageSkeleton />}><News /></Suspense>} />
        
        {/* Post deep link for notifications */}
        <Route path="/post/:postId" element={<Suspense fallback={<GenericPageSkeleton />}><PostDeepLinkPage /></Suspense>} />
        <Route path="/post/:postId/comment/:commentId" element={<Suspense fallback={<GenericPageSkeleton />}><CommentDeepLinkPage /></Suspense>} />
        
        
        
        {/* /video/:videoId route removed in PR-5 — :videoId is a post id (shared across video surfaces), so preserve deep links via the unified /post viewer. */}
        <Route path="/video/:videoId" element={<VideoIdToPostRedirect />} />



        
        {/* Legacy creator routes - redirect to home (creators now handled via Business profiles or Personal Creator Mode) */}
        <Route path="/creator/*" element={<Navigate to="/" replace />} />
        <Route path="/creators/*" element={<Navigate to="/" replace />} />
        <Route path="/season-shop" element={<Navigate to="/clubhouse" replace />} />
        <Route path="/challenges" element={<Navigate to="/clubhouse" replace />} />
        
        
        <Route element={<Suspense fallback={<GenericPageSkeleton />}><MessagingShell /></Suspense>}>
          <Route path="/messages" element={<Suspense fallback={<GenericPageSkeleton />}><InboxV2Page /></Suspense>} />
          <Route path="/messages/:conversationId" element={<Suspense fallback={<GenericPageSkeleton />}><ThreadV2Page /></Suspense>} />
        </Route>
        



        <Route path="/notificationmessages" element={<Suspense fallback={<ActivityPageSkeleton />}><ActivityPageV2 /></Suspense>} />
        <Route path="/golferstofollow" element={<Suspense fallback={<GenericPageSkeleton />}><GolfersToFollowV2 /></Suspense>} />
        <Route path="/friends" element={<Suspense fallback={<GenericPageSkeleton />}><OwnProfileSocialRedirect tab="friends" /></Suspense>} />
        
        <Route path="/followers" element={<Suspense fallback={<GenericPageSkeleton />}><OwnProfileSocialRedirect tab="followers" /></Suspense>} />
        <Route path="/following" element={<Suspense fallback={<GenericPageSkeleton />}><OwnProfileSocialRedirect tab="following" /></Suspense>} />
        <Route path="/profile/:username/followers" element={<Suspense fallback={<GenericPageSkeleton />}><ProfileSocialListRoute direction="followers" /></Suspense>} />
        <Route path="/profile/:username/following" element={<Suspense fallback={<GenericPageSkeleton />}><ProfileSocialListRoute direction="following" /></Suspense>} />
        <Route path="/profile/:username/friends" element={<Suspense fallback={<GenericPageSkeleton />}><FriendsRedirectToFollowing /></Suspense>} />

        
        {/* Business routes */}
        <Route path="/businesses/manage" element={<Suspense fallback={<GenericPageSkeleton />}><MyBusinessesPage /></Suspense>} />
        
        <Route path="/business/create" element={<Suspense fallback={<ManagePageSkeleton />}><BusinessProfileEditor /></Suspense>} />
        <Route path="/business/:id/insights" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessInsightsPageV2 /></Suspense>} />
        {/* Club Analytics — verified Golf Clubs only; the page carries the gate. */}
        <Route path="/business/:id/course" element={<Suspense fallback={<GenericPageSkeleton />}><ClubAnalyticsPage /></Suspense>} />
        <Route path="/business/:id/edit" element={<Suspense fallback={<ManagePageSkeleton />}><BusinessProfileEditor /></Suspense>} />

        <Route path="/business/success" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessProfileLiveSuccessPage /></Suspense>} />
        <Route path="/business/:id/verification" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessVerificationPage /></Suspense>} />
        <Route path="/business/:businessId/team" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessTeamPage /></Suspense>} />
        <Route path="/business/:businessId/team/invite" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessInvitePage /></Suspense>} />
        <Route path="/business/invite/accept" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessInviteAcceptPage /></Suspense>} />
        <Route path="/business/:businessId/activity" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessActivityPage /></Suspense>} />
        <Route path="/business/:id/reviews" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessReviewsPage /></Suspense>} />
        <Route path="/business/:idOrSlug/followers" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessSocialListRoute direction="followers" /></Suspense>} />
        <Route path="/business/:idOrSlug/following" element={<Suspense fallback={<GenericPageSkeleton />}><BusinessSocialListRoute direction="following" /></Suspense>} />

        <Route path="/business/:idOrSlug" element={<Suspense fallback={<ProfileSkeleton />}><BusinessProfilePage /></Suspense>} />
        
        
        <Route path="/top100/:slug" element={<Navigate to="/courses?tab=top100" replace />} />
        <Route path="/achievementshub" element={<Navigate to="/profile" replace />} />
        <Route path="/achievements" element={<Navigate to="/profile" replace />} />
        <Route path="/achievements/:userId" element={<Navigate to="/profile" replace />} />
        <Route path="/admin-setup" element={<Suspense fallback={<GenericPageSkeleton />}><AdminSetupPage /></Suspense>} />
        
        {/* Old /admin routes removed — redirected to admin-v2 */}
        <Route path="/admin" element={<Navigate to="/admin-v2/dashboard" replace />} />
        <Route path="/admin/*" element={<Navigate to="/admin-v2/dashboard" replace />} />

        {/* Admin — mobile-first console */}
        <Route
          path="/admin-v2/*"
          element={
            <Suspense fallback={<GenericPageSkeleton />}>
              <AdminShell />
            </Suspense>
          }
        />


        {/* /create-moment removed — PostStudio is now the sole creation flow */}
        <Route path="/error-logs" element={<ErrorLogPage />} />
        
        {/* Echo AI (v2) */}
        <Route path="/echo" element={<Suspense fallback={<HubSkeleton />}><EchoV2Page /></Suspense>} />
        <Route path="/echo/history" element={<Suspense fallback={<HubSkeleton />}><EchoHistoryPage /></Suspense>} />
        <Route path="/echo/:chatId" element={<Suspense fallback={<HubSkeleton />}><EchoV2Page /></Suspense>} />

        {/* Legacy /echo-v2 redirects */}
        <Route path="/echo-v2" element={<Navigate to="/echo" replace />} />
        <Route path="/echo-v2/history" element={<Navigate to="/echo/history" replace />} />
        <Route path="/echo-v2/:chatId" element={<EchoV2Redirect />} />



        


        
        <Route path="/game/:id" element={<Navigate to="/clubhouse" replace />} />

        {/* Games routes — decommissioned, redirect to Clubhouse */}
        <Route path="/games/discover" element={<Navigate to="/clubhouse" replace />} />
        <Route path="/nearby" element={<Navigate to="/clubhouse" replace />} />
        
        {/* Tour Hub routes */}
        <Route path="/tourhub" element={<Suspense fallback={<TourHubOverviewSkeleton />}><TourHubMainPage /></Suspense>} />
        <Route path="/tourhub/tournament/:tournamentId" element={<Suspense fallback={<TournamentPageSkeleton />}><TournamentDetailPage /></Suspense>} />
        
        <Route path="/tourhub/player/:playerId" element={<Suspense fallback={<PlayerPageSkeleton />}><PlayerProfilePage /></Suspense>} />
        <Route path="/tourhub/college-golf" element={<Suspense fallback={<CollegeHubSkeleton />}><CollegeGolfHubPage /></Suspense>} />
        <Route path="/tourhub/college-golf/compare" element={<Suspense fallback={<GenericPageSkeleton />}><CollegeComparePage /></Suspense>} />
        <Route path="/tourhub/college-golf/:collegeSlug" element={<Suspense fallback={<CollegeHubSkeleton />}><CollegeProfilePage /></Suspense>} />
        
        {/* Hub routes removed — redirects to clubhouse */}
        <Route path="/hub" element={<Navigate to="/clubhouse" replace />} />
        <Route path="/hub/*" element={<Navigate to="/clubhouse" replace />} />
        
        



        <Route path="/privacy" element={<Suspense fallback={<GenericPageSkeleton />}><PrivacyPolicyPage /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<GenericPageSkeleton />}><TermsPage /></Suspense>} />
        <Route path="/legal/:slug" element={<Suspense fallback={<GenericPageSkeleton />}><LegalDocumentPage /></Suspense>} />

        {/* Public invite landings — logged-out, no header/nav chrome */}
        <Route path="/join" element={<Suspense fallback={<GenericPageSkeleton />}><JoinLandingPage /></Suspense>} />
        <Route path="/i/:inviteCode" element={<Suspense fallback={<GenericPageSkeleton />}><InviteLandingPage /></Suspense>} />



        <Route path="*" element={<Suspense fallback={<GenericPageSkeleton />}><NotFound /></Suspense>} />
      </Routes>

      {state?.backgroundLocation && (
        <Routes>
          <Route path="/courses/:courseId/rate" element={<ReviewComposerOverlay />} />
          <Route path="/rate-course-v2/:courseId" element={<ReviewComposerOverlay />} />
        </Routes>
      )}


      
      {/* VideoPlayerModal removed in PR-5 (queue family strip). */}
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
      // `true` (not 'always'): honours staleTime, but DOES refetch when a query
      // mounts holding data an invalidation already marked stale. Without this,
      // invalidateQueries only ever refreshed on-screen queries.
      refetchOnMount: true,
      refetchOnReconnect: false,
      networkMode: 'online',
    } : {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000, // 1 minute — safe fallback, never 0 at scale
      gcTime: 5 * 60 * 1000,
      // See note above: honours staleTime, acts on invalidations after remount.
      refetchOnMount: true,
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
      
    </>
  );
};

// AppInner - All hooks that need React Query context
const AppInner: React.FC = () => {
  // Global focus re-auth hook
  useReauthOnFocus();
  // iOS silent-switch tap-to-unmute hint.
  useSilentSwitchHint();

  // Push notification registration — runs on every cold launch.
  // Waits for the Median bridge to be ready (avoids TLS-cold-pool transport
  // rejections), then retries the edge invoke with backoff.
  useEffect(() => {
    let cancelled = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const runWhenMedianReady = (fn: () => void) => {
      const w = window as any;
      if (w.median?.onReady?.push) {
        w.median.onReady.push(fn);
        return;
      }
      // Fallback: poll for the bridge up to ~8s.
      let tries = 0;
      pollInterval = setInterval(() => {
        tries++;
        if ((window as any).median?.onesignal || tries > 16) {
          if (pollInterval) clearInterval(pollInterval);
          pollInterval = null;
          if (!cancelled) fn();
        }
      }, 500);
    };

    const registerWithRetry = async (platform: string, attempts = 3): Promise<boolean> => {
      for (let i = 0; i < attempts; i++) {
        if (cancelled) return false;
        try {
          const { error } = await supabase.functions.invoke('register-push-device', {
            body: { platform, enabled: true },
          });
          if (!error) return true;
          console.error('[Push] Registration failed:', error.message ?? error);
        } catch (e: any) {
          // FunctionsFetchError (transport reject) lands here on cold boot.
          console.error('[Push] invoke threw:', e?.name, e?.message);
        }
        await new Promise(r => setTimeout(r, 800 * (i + 1)));
      }
      return false;
    };

    const register = async () => {
      try {
        const os = (window as any).median?.onesignal;
        if (!os) return;

        // Wait for auth — retry every second for up to 10 seconds.
        let session = null;
        for (let i = 0; i < 10; i++) {
          if (cancelled) return;
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) { session = data.session; break; }
          await new Promise(r => setTimeout(r, 1000));
        }
        if (!session?.user) return;

        const userId = session.user.id;

        // OneSignal v5 bridge: setConsentGiven + login link external_id.
        // Older method names are kept as fallbacks (?. no-ops if undefined).
        try { os.setConsentGiven?.(true); } catch {}
        try { os.userPrivacyConsent?.(true); } catch {}
        try { os.login?.(userId); } catch {}
        try { os.User?.addAlias?.('external_id', userId); } catch {}

        // ── Deep-link on notification tap ──────────────────────────────
        // The OneSignal v5 web SDK event API does NOT exist in Median's
        // bridge (Median wires the WebView to the NATIVE OneSignal SDKs via
        // JS Bridge). We rely on:
        //   1) Server-side `targetUrl` in Additional Data (Median auto-nav).
        //   2) Global `median_onesignal_push_opened(payload)` defined at
        //      module scope below (Median calls it on every open).
        // No listeners registered here.

        // Clear iOS app icon badge on cold open + on every foreground.
        import('@/utils/pushBadge').then((m) => m.clearAppBadge());

        const platform = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
          ? 'ios' : 'android';

        const ok = await registerWithRetry(platform);
        if (ok) console.log('[Push] Registered:', userId);

      } catch (e: any) {
        console.error('[Push] Error:', e?.name, e?.message);
      }
    };

    runWhenMedianReady(register);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        import('@/utils/pushBadge').then((m) => m.clearAppBadge());
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // ── Analytics: session start + page tracking ──
  useEffect(() => {
    // The session id is owned by getSessionId(): localStorage plus a 30 minute
    // inactivity timeout. Boot must NOT mint one, or an app reopen would again
    // start a new "session" and the metric would keep counting app opens.
    import('@/utils/analyticsSession').then(({ getSessionId }) => {
      const sessionId = getSessionId();
      import('@/utils/analyticsEvents').then(({ analyticsEvents }) => {
        analyticsEvents.track('session_start', {
          session_id: sessionId,
          referrer: document.referrer || 'direct',
        });
      });
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
  
  // Location broadcast removed — nearby feature retired
  
// Listen for Top 100 XP notifications
  useTop100XpNotifications();
  
  // Real-time course ratings listener for instant card updates
  useCourseRatingsRealtime();
  // TODO Brief 3: re-wire media cache service worker
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
        <MaintenanceGate>
        <NavTimingProvider>
        <AdminGatedPerfHud />
        <AdminGatedLogHud />
        <AdminGatedPerfPill />
        <AdminGatedBootTimelinePill />
        <AdminGatedAudioDebugHud />
        <AdminGatedAudioLogsButton />

        
        
        

        <HeaderProvider>
            <ModalProvider>
              <BottomNavigationProvider>
                
                  <UIProvider>
                    
                        <ActiveActorProvider>
                          
                          <ScrollToTop />
                          <ScrollRestoration />
                          <LockAnchorSync />
                          
                              {/* REMOVED: FullscreenPlayerProvider — Phase 5 fullscreen system deleted */}
                                <TopTenProvider>
                                  <VideoPlaybackProvider>
                                      <ErrorBoundary>
                                        <MountSignal />
                                        <AuthWrapper>
                                        <DeletedAccountGate>
                                          <InAppNotificationsMount />
                                          <GenderPromptSheet />



                                          <FriendSheetProvider>

                                            <InviteSheetProvider>
                                            <SeasonWrapModal />
                                            <AchievementToastWrapper />
                                            <LevelUpGate />
                                            <Suspense fallback={null}>
                                              <UserStatsCoursesProvider>
                                                <div className="app-depth">
                                                  {/* Global header for all pages except Clubhouse/Auth/Admin */}
                                                  <AppShellOnly><GlobalHeader /></AppShellOnly>
                                                  <AppRoutes />
                                                  
                                                </div>
                                              </UserStatsCoursesProvider>
                                            </Suspense>
                                            {/* Continue Watching mini-player - persists across navigation. Queue drawer removed in PR-5. */}
                                            <Suspense fallback={null}>
                                              <MiniPlayer />
                                            </Suspense>
                                            {/* Fullscreen Feed Overlay - portal-based, renders above everything */}
                                            <FullscreenFeedOverlay />
                                            
                                            {/* Unified ReviewBottomSheet portal — single mount, store-driven */}
                                            <ReviewBottomSheetPortal />
                                            <RequestCourseSheetHost />
                                            </InviteSheetProvider>
                                          </FriendSheetProvider>
                                        </DeletedAccountGate>
                                        </AuthWrapper>

                                        <Sonner />
                                        <AppShellOnly><GlobalBottomNavigation /></AppShellOnly>
                                        <GlobalPostComposer />
                                      </ErrorBoundary>
                                  </VideoPlaybackProvider>
                                </TopTenProvider>
                              {/* END REMOVED FullscreenPlayerProvider */}
                            

                        </ActiveActorProvider>
                    
                  </UIProvider>
                
              </BottomNavigationProvider>
            </ModalProvider>
          </HeaderProvider>
        </NavTimingProvider>
        </MaintenanceGate>
      </BrowserRouter>
    </TooltipProvider>
  );
};

// Lazy import AppPrefetchProvider at module scope to avoid per-render lazy refs
const AppPrefetchProvider = React.lazy(() => import('@/providers/AppPrefetchProvider'));

// MountSignal — rendered deep inside the provider/Suspense tree so the
// index.html boot watchdog is only disarmed once real routed UI has mounted.
const MountSignal: React.FC = () => {
  useEffect(() => {
    (window as any).__APP_MOUNTED__ = true;
    if (typeof (window as any).__cancelMountDeadline === 'function') {
      (window as any).__cancelMountDeadline();
    }
  }, []);
  return null;
};

// App - Outer wrapper with QueryClientProvider
const App: React.FC = () => {
  return (
    <>
      <AppShell>
        <ReviewIslandLoader />
        <ErrorBoundary>
          <MotionConfig reducedMotion="user">
            <ThemeProvider defaultTheme="dark" storageKey="clbhouz-ui-theme">
              <Top100DebugProvider>
                <PersistQueryClientProvider
                  client={queryClient}
                  persistOptions={{
                    persister: queryPersister,
                    maxAge: PERSIST_MAX_AGE_MS,
                    buster: __BUILD_ID__,
                    dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
                  }}
                >
                  <Suspense fallback={<div style={{ background: '#F8FAFC', minHeight: '100dvh' }} />}>
                    <AppPrefetchProvider delay={2000} enabled={true}>
                      <RehydrationProvider>
                        <PostEventsBridge>
                          <UploadToastsBridge />
                          <PendingPostsController />
                          <UploadProgressBanner />
                          <AppInner />
                        </PostEventsBridge>
                      </RehydrationProvider>
                    </AppPrefetchProvider>
                  </Suspense>
                </PersistQueryClientProvider>
              </Top100DebugProvider>
            </ThemeProvider>
          </MotionConfig>
        </ErrorBoundary>
      </AppShell>
    </>

  );
};

export default App;

