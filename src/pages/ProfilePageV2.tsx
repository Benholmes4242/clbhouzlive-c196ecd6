/**
 * ProfilePageV2 - LinkedIn-style Light Profile
 * Exact match to design mock
 */

import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AnimatedNumber } from '@/components/ui/motion';
import { cn } from '@/lib/utils';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEditProfileRoute } from '@/hooks/useEditProfileRoute';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useOpenFriendSheet } from '@/components/friend-sheet/FriendSheetProvider';
import { compareRouteFor, useMemberTapResolver } from '@/components/friend-sheet/useMemberTapResolver';
import { useUserProfile } from '@/hooks/useUserProfile.tsx';
import PostsTabContent from '@/components/posts-tab/PostsTabContent';
import { usePersonalPostsCount } from '@/hooks/usePersonalPostsCount';
import { usePersonalReviewsCount } from '@/hooks/usePersonalReviewsCount';
import { getProfileType, getProfileTabs } from '@/hooks/useProfileType';
import { useFollowState } from '@/hooks/useFollowState';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useFriendship } from '@/hooks/useFriendship';
import { useSocialCounts } from '@/hooks/useSocialCounts';
import { useRealtimeSocialCounts } from '@/hooks/useRealtimeSocialCounts';
import { useMyBusinesses } from '@/hooks/useMyBusinesses';
import { useBlockActions } from '@/hooks/useBlockActions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { Trophy, ChevronRight, ChevronDown, ChevronLeft, MoreHorizontal, Send, UserPlus, UserCheck, UserMinus, Check, ExternalLink, Loader2, ArrowLeft, Pencil, Camera, Share2, Link2, Flag, Ban, Settings, Building2, MessageCircle } from 'lucide-react';
import { useStartConversation } from '@/hooks/messaging/useStartConversation';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';
import { PageRoot } from '@/components/layout/PageRoot';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

import { safeGoBack } from '@/utils/navigation';
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
import { getInitialsFromName, getAvatarFallbackColor } from '@/lib/avatarFallback';
import { useTranslation } from 'react-i18next';
import { ProfileHero, HeroPill } from '@/components/profile/hero/ProfileHero';
import { ProfileTopTenRail } from '@/components/profile/hero/ProfileTopTenRail';
import { VerifiedAccountsNote } from '@/components/profile/VerifiedAccountsNote';
import { AddCourseModal } from '@/components/profile/courses/AddCourseModal';
import { PrivateProfileGate } from '@/components/profile/PrivateProfileGate';
import { CoverPhotoFallback } from '@/components/ui/CoverPhotoFallback';
// FloatingPageHeader removed (H3) — chrome now driven by ChromeIsland registry.
import { FilterChips } from '@/components/ui/FilterChips';
import { useWhsConnection } from '@/lib/whs/hooks';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import { openExternalUrl } from '@/utils/median/openExternalUrl';
import { SiInstagram, SiX, SiTiktok, SiYoutube } from 'react-icons/si';


import { useProfileAchievements } from '@/hooks/useProfileAchievements';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Tab content components
// PostsTabContent imported above
import { ProfileCoursesTab } from '@/components/profile/ProfileCoursesTab';
import AchievementsPane from '@/components/profile/AchievementsPane';
import { A, SANS, Panel, StatRow, Action } from '@/features/courses/components/holes/analytical/tokens';
import { formatNumber } from '@/i18n/format';
import { useUserCourseSummary } from '@/hooks/useUserCourseSummary';
import { useUserAnalyticsCourses } from '@/hooks/gam/useUserAnalyticsCourses';

import { analyticsEvents } from '@/utils/analyticsEvents';
import ClubsCard from '@/components/profile/clubs/ClubsCard';
import { useProfileClubs } from '@/components/profile/hooks/useProfileClubs';
import { GolfJourneyProgress } from '@/components/profile/phase6';
import ProfileAchievementsRail from '@/components/profile/ProfileAchievementsRail';
import { AvatarLightbox } from '@/components/shared/AvatarLightbox';
import { ImageCropModal } from '@/components/business/ImageCropModal';
import { ProfileTouchDebugProvider, useProfileTouchDebug } from '@/components/profile/debug/ProfileTouchDebugProvider';
import { ProfileTouchDebugPanel } from '@/components/profile/debug/ProfileTouchDebugPanel';
import { ReportSheet } from '@/components/moderation/ReportSheet';
import { PhotoActionSheet } from '@/components/profile/edit-v2/PhotoActionSheet';


// Background color - uses CSS variable for theme support
const BG_COLOR = 'var(--bg-page)';

// UUID v4 detection regex
const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

// Clubs section wrapper component
const ClubsSectionWrapper: React.FC<{
  profileId: string | undefined;
  viewerId: string | undefined;
  isPersonal: boolean;
  isSelf: boolean;
}> = ({ profileId, viewerId, isPersonal, isSelf }) => {
  const navigate = useNavigate();
  const editRoute = useEditProfileRoute();
  const { homeClub, secondaryClubs, isLoading, isPrivate } = useProfileClubs(profileId, viewerId);

  if (!isPersonal || !profileId || !viewerId || isLoading) return null;

  return (
    // Reduced mb: mb-6 → mb-4 (16px from clubs to tabs)
    <section className="px-4 mb-4">
      <ClubsCard
        homeClub={homeClub}
        secondaryClubs={secondaryClubs}
        isOwner={isSelf}
        isPrivate={isPrivate}
        onEditClick={() => navigate(editRoute)}
      />
    </section>
  );
};

const ProfilePageV2Content: React.FC = () => {
  const navigate = useNavigate();
  const editRoute = useEditProfileRoute();
  const { username: routeUsername } = useParams<{ username?: string }>();
  const { user, loading: authLoading } = useSupabaseSession();
  const { open: openHybridSheet } = useOpenFriendSheet();
  const { resolve: resolveMemberTap } = useMemberTapResolver();

  const { logPoint } = useProfileTouchDebug();
  
  // Hide global header for full-bleed immersive profile
  useHideHeader();
  // Status bar transparency is owned by AppRoutes/applyRouteChrome (single owner).
  
  // If viewing via /profile/:username, fetch that profile; otherwise show own profile
  // Resolve profileUserId — cached query for username routes, synchronous for own profile
  const { data: resolvedProfileId, isLoading: isResolvingId, isError: resolveError, refetch: refetchResolve } = useQuery({
    queryKey: ['profile-id-by-username', routeUsername],
    enabled: !!routeUsername,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      // Resolve via the base table first (works for self / permitted relationships,
      // and still distinguishes soft-deleted rows). RLS returns no row for
      // strangers, so we fall back to public_profiles below.
      const query = supabase.from('user_profiles').select('id, deleted_at');
      const { data, error } = await (isUuid(routeUsername!)
        ? query.eq('id', routeUsername!)
        : query.eq('username', routeUsername!)
      ).maybeSingle();
      if (!error && data) {
        if (data.deleted_at != null) return { id: null as string | null, deleted: true, notFound: false };
        return { id: data.id, deleted: false, notFound: false };
      }

      // Fallback: stranger / logged-out viewer. public_profiles already excludes
      // deleted + suspended + unconfirmed users, so a hit here is a valid public
      // profile; a miss is a genuine not-found.
      const pubQuery = supabase.from('public_profiles').select('id');
      const { data: pub, error: pubError } = await (isUuid(routeUsername!)
        ? pubQuery.eq('id', routeUsername!)
        : pubQuery.eq('username', routeUsername!)
      ).maybeSingle();
      if (pubError) throw pubError;
      if (!pub) return { id: null as string | null, deleted: false, notFound: true };
      return { id: pub.id, deleted: false, notFound: false };
    },
  });

  const profileUserId: string | undefined = routeUsername
    ? (resolvedProfileId?.id ?? undefined)
    : user?.id;
  const isProfileDeleted = resolvedProfileId?.deleted === true;
  const profileNotFound = resolvedProfileId?.notFound === true;
  
  const { t } = useTranslation('profile');
  const { data: profile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useUserProfile(profileUserId);
  const { data: postsCount = 0, isLoading: postsCountLoading } = usePersonalPostsCount(profileUserId);
  const { data: reviewsCount = 0, isLoading: reviewsCountLoading } = usePersonalReviewsCount(profileUserId);
  const { data: achievements, isLoading: achievementsLoading } = useProfileAchievements(profileUserId);

  // Two-flag model:
  //   isOwnAccount = the auth user owns this profile (drives personal-identity UI:
  //                  handicap, Top Ten curation, settings, avatar uploader, bio prompt).
  //   isSelfView   = actor-aware "truly me viewing me" (drives action-button row,
  //                  follow/friendship hooks, sticky CTAs). When acting as a business
  //                  on the owner's personal profile, isOwnAccount=true but isSelfView=false.
  const isOwnAccount = user?.id === profileUserId;
  const isSelf = isOwnAccount; // legacy alias - preserves personal-identity-owned UI below




  const followToggle = useToggleFollow();
  const { activeActor } = useActiveActor();
  const viewerActorType: 'personal' | 'business' = activeActor?.type ?? 'personal';
  const viewerActorId = activeActor?.id ?? user?.id;
  const isSelfView = isOwnAccount && viewerActorType === 'personal';
  const { isFollowing: cachedFollowing } = useFollowState({
    targetActorType: 'personal',
    targetActorId: isSelfView ? undefined : profileUserId,
    viewerActorType,
    viewerActorId,
  });
  const isFollowing = cachedFollowing ?? false;
  const followBusy = followToggle.isPending;
  const toggleFollow = () => {
    if (isSelfView || !user?.id || !profileUserId || !viewerActorId) return;
    followToggle.mutate({
      targetActorType: 'personal',
      targetActorId: profileUserId,
      targetUserId: profileUserId,
      viewerActorType,
      viewerActorId,
      viewerUserId: user.id,
      isFollowing,
    });
  };

  const { start: startConversation, isStarting: dmStarting } = useStartConversation();
  const {
    status: friendshipStatus,
    isUpdating: friendshipUpdating,
    sendRequest,
    cancelRequest,
    acceptRequest,
    declineRequest,
    unfriend,
  } = useFriendship(isSelfView || viewerActorType === 'business' ? undefined : profileUserId);

  const isPrivateAndLocked =
    !isSelf &&
    profile?.is_public === false &&
    friendshipStatus !== 'friends';

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = useMemo(() => {
    const tabParam = searchParams.get('tab');
    const validTabs = ['activity', 'courses', 'top100', 'handicap', 'stats'];
    return tabParam && validTabs.includes(tabParam) ? tabParam : 'activity';
  }, []);

  // Deep-link consumption for Top-10 comment notifications (Item 2B).
  // URL contract: ?tab=courses&course=<id>&top_ten_comment=<id>[&top_ten_parent=<id>]
  // One-shot: capture on mount, then clear the params so back-navigation
  // doesn't re-open the sheet.
  const deepLinkTopTen = useRef<{
    courseId: string | null;
    commentId: string | null;
    parentId: string | null;
  } | null>(null);
  if (deepLinkTopTen.current === null) {
    deepLinkTopTen.current = {
      courseId: searchParams.get('course'),
      commentId: searchParams.get('top_ten_comment'),
      parentId: searchParams.get('top_ten_parent'),
    };
  }
  useEffect(() => {
    if (!deepLinkTopTen.current?.commentId) return;
    // Strip the one-shot params so re-entering the page doesn't re-fire.
    const next = new URLSearchParams(searchParams);
    let changed = false;
    for (const k of ['course', 'top_ten_comment', 'top_ten_parent']) {
      if (next.has(k)) { next.delete(k); changed = true; }
    }
    if (changed) setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const [activeSection, setActiveSection] = useState(initialTab);
  const [bioExpanded, setBioExpanded] = useState(false);
  /* READ MORE is gated on a MEASUREMENT, not a character count: a char count
     cannot predict rendered lines (viewport width, font metrics, word breaks). */
  const bioRef = useRef<HTMLDivElement>(null);
  const [bioOverflows, setBioOverflows] = useState(false);
  /* Measure while CLAMPED only: once expanded the clamp is off and
     scrollHeight === clientHeight, which would report "no overflow" and hide
     READ LESS, trapping the reader. ResizeObserver re-evaluates on rotation
     and width changes. +1 absorbs sub-pixel rounding. */
  useLayoutEffect(() => {
    const el = bioRef.current;
    if (!el || bioExpanded) return;
    const measure = () => setBioOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [profile?.bio, bioExpanded]);

  const [activeMiniNav, setActiveMiniNav] = useState('posts');
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showTopTenModal, setShowTopTenModal] = useState(false);

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const avatarTakeInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [photoSheet, setPhotoSheet] = useState<'avatar' | null>(null);
  const queryClient = useQueryClient();

  const profileTypeInfo = getProfileType(profile?.user_type);
  const { isPersonal } = profileTypeInfo;
  const allTabs = getProfileTabs(profile?.user_type);
  // Per fix brief §5.1 — Handicap is now a top-level page for everyone,
  // hidden from all profile tab strips (own and friend).
  const tabs = useMemo(
    () => allTabs.filter(t => t.id !== 'stats' && t.id !== 'top100'),
    [allTabs]
  );

  // Per fix brief §5.2 — legacy ?tab=stats deep links redirect to the
  // dedicated handicap route. Own profile → /handicap. Another member →
  // compare against them, since their handicap page is private to them.
  useEffect(() => {
    if (activeSection !== 'stats') return;
    if (isSelf) {
      analyticsEvents.track('handicap_legacy_redirect_fired', { source: 'profile_stats_tab' });
      navigate('/handicap', { replace: true });
    } else if (profile?.id) {
      analyticsEvents.track('handicap_legacy_redirect_fired', { source: 'friend_profile_stats_tab' });
      // A legacy ?tab=stats link on someone else's profile can no longer land
      // on their handicap page. Compare answers the same question.
      navigate(compareRouteFor(profile.id), { replace: true });
    }
  }, [activeSection, isSelf, profile?.id, navigate]);

  // Legacy ?tab=top100 deep links → Courses tab (Top 100 now lives in the
  // Courses tab's All/Top 100 toggle). Mirrors the stats-tab retirement.
  useEffect(() => {
    if (activeSection === 'top100') {
      setActiveSection('courses');
      setSearchParams({ tab: 'courses' }, { replace: true });
    }
  }, [activeSection, setSearchParams]);

  const { data: socialCounts, isLoading: socialCountsLoading } = useSocialCounts(
    profileUserId ? { type: 'personal', id: profileUserId } : undefined,
  );
  const followersCount = socialCounts?.followers ?? 0;

  // Shell figures. Courses come from the same summary hook the Courses tab
  // uses; rounds come from the own-profile analytics RPC (auth.uid()).
  const { totalCoursesPlayed: shellCoursesPlayed } = useUserCourseSummary(profileUserId ?? undefined);
  const { data: shellAnalyticsCourses } = useUserAnalyticsCourses({ enabled: !!isSelf });
  const shellRoundsCount = React.useMemo(() => {
    if (!isSelf) return null;
    if (!shellAnalyticsCourses) return null;
    return shellAnalyticsCourses.reduce((sum, r) => sum + (r.rounds_count ?? 0), 0) || null;
  }, [isSelf, shellAnalyticsCourses]);
  const followingCount = socialCounts?.following ?? 0;
  const friendsCount = isPersonal ? (socialCounts?.friends ?? 0) : 0;
  
  useRealtimeSocialCounts({
    viewerUserId: user?.id ?? null,
    profileUserId: profileUserId ?? null,
  });

  const { blockUser } = useBlockActions({ currentUserId: user?.id || '' });

  const { data: myBusinesses } = useMyBusinesses(isSelf ? user?.id : undefined);

  const handleTabChange = (tab: string) => {
    setActiveSection(tab);
    if (tab === 'activity') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  const unlockedAchievements = achievements || [];

  const handleAvatarFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropImageSrc(URL.createObjectURL(file));
    setIsCropModalOpen(true);
    if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
  };

  const handleAvatarUpload = async (croppedFile: File) => {
    if (!user?.id) return;
    setIsUploadingAvatar(true);
    try {
      const fileExt = croppedFile.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;
      const result = await uploadToR2Only(croppedFile, 'clbhouz-profile-images', fileName);
      if (!result.success) throw new Error(result.error || 'Upload failed');
      const { error: updateError } = await supabase.from('user_profiles').update({ profile_photo_url: result.publicUrl }).eq('id', user.id);
      if (updateError) {
        console.error('[ProfilePage] Avatar DB update failed:', updateError);
        toast.error('Failed to save avatar. Please try again.');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['user-profile', profileUserId] });
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      toast.success('Profile photo updated');
    } catch (err) {
      console.error('[ProfilePage] Avatar upload error:', err);
      toast.error('Failed to update profile photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user?.id) return;
    const { error } = await supabase.from('user_profiles').update({ profile_photo_url: null }).eq('id', user.id);
    if (error) { toast.error('Failed to remove profile photo'); return; }
    queryClient.invalidateQueries({ queryKey: ['user-profile', profileUserId] });
    queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
    toast.success('Profile photo removed');
  };
  const handleCropComplete = (croppedFile: File) => {
    setIsCropModalOpen(false);
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
    handleAvatarUpload(croppedFile);
  };

  const handleCropCancel = (open: boolean) => {
    if (!open) {
      if (cropImageSrc) {
        URL.revokeObjectURL(cropImageSrc);
        setCropImageSrc(null);
      }
      setIsCropModalOpen(false);

    }
  };

  const { data: viewedWhsConnection } = useWhsConnection(profileUserId ?? undefined);
  const resolvedHcp = resolveDisplayHandicap({
    egHandicapIndex: profile?.eg_handicap_index ?? null,
    manualHandicapIndex: profile?.manual_handicap_index ?? null,
    hasWhsConnection: !!viewedWhsConnection,
  });

  const formatHandicap = (hcp: number | null | undefined): string => {
    if (hcp == null) return '–';
    return hcp.toFixed(1);
  };
  
  const formatUrlForDisplay = (url: string): string => {
    if (!url) return '';
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    }
  };
  
  const ensureProtocol = (url: string): string => {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
  };
  
  const getFriendButtonLabel = () => {
    switch (friendshipStatus) {
      case 'friends':
        return 'Friends';
      case 'request_sent':
        return 'Requested';
      case 'request_received':
        return 'Accept';
      default:
        return 'Add Friend';
    }
  };
  
  const handleFriendAction = async () => {
    switch (friendshipStatus) {
      case 'none':
        await sendRequest();
        break;
      case 'request_sent':
        await cancelRequest();
        break;
      case 'request_received':
        await acceptRequest();
        break;
      case 'friends':
        await unfriend();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    // eslint-disable-next-line settled/no-not-loading-empty-check -- authLoading is the session flag, not a React Query.
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading || (!!routeUsername && isResolvingId) || profileLoading) {
    return <ProfileSkeleton />;
  }

  if (resolveError || profileError) {
    return (
      <PageRoot className="min-h-screen bg-background" immersiveStatusBar>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Couldn't load this profile
          </h1>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Check your connection and try again.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { if (resolveError) refetchResolve(); if (profileError) refetchProfile(); }}
              className="px-6 py-2.5 text-white rounded-full text-sm font-semibold active:scale-[0.97]"
              style={{ backgroundColor: '#F7931E' }}
            >
              Retry
            </button>
            <button
              onClick={() => safeGoBack(navigate, '/clubhouse')}
              className="px-6 py-2.5 rounded-full text-sm font-semibold border border-border/10 text-foreground active:scale-[0.97]"
            >
              Go back
            </button>
          </div>
        </div>
      </PageRoot>
    );
  }

  // Show "Profile unavailable" for deleted or not found profiles
  if (isProfileDeleted || profileNotFound) {
    return (
      <PageRoot className="min-h-screen bg-background" immersiveStatusBar>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl text-muted-foreground">?</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Profile unavailable
          </h1>
          <p className="text-muted-foreground mb-6 max-w-sm">
            This profile doesn't exist or is no longer available.
          </p>
          <button
            onClick={() => safeGoBack(navigate, '/clubhouse')}
            className="px-6 py-2.5 text-white rounded-full text-sm font-semibold transition-colors active:scale-[0.97]"
            style={{ backgroundColor: '#F7931E' }}
          >
            Go back
          </button>
        </div>
      </PageRoot>
    );
  }

  if (!user) return null;

  const displayName = profile?.display_name || 'Golfer';
  const avatarInitials = getInitialsFromName(displayName) || '?';
  const avatarFallbackKey = profile?.id || displayName || 'user';
  const username = profile?.username || 'user';
  const heroUrl = profile?.header_photo_url || profile?.profile_photo_url || '';
  const websites = profile?.websites || [];

  const getCurrentContent = () => {
    switch (activeSection) {
      case 'activity':
        return (
          <PostsTabContent
            actorType="personal"
            actorId={profile?.id || ''}
            isOwnProfile={isSelf}
          />
        );
      case 'courses':
        return (
          <ProfileCoursesTab 
            userId={profile?.id || ''}
            isOwnProfile={isSelf}
            displayName={profile?.display_name ?? profile?.username}
          />
        );
      case 'achievements':
        if (achievementsLoading) {
          return (
            <div className="px-4 pt-6">
              <Skeleton className="h-4 w-32 rounded mb-4" />
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="w-full rounded-xl" style={{ aspectRatio: '3 / 4' }} />
                ))}
              </div>
            </div>
          );
        }
        return (
          <AchievementsPane 
            userId={profile?.id}
            userDisplayName={profile?.display_name || 'User'}
            userHandicap={resolvedHcp.value}
            userProfilePhotoUrl={profile?.profile_photo_url}
            isCurrentUser={isSelf}
          />
        );
      default:
        return null;
    }
  };

  return (
    <PageRoot className="min-h-screen" style={{ background: BG_COLOR, position: 'relative' }} immersiveStatusBar immersive>
      {/* Correction 1: the separate 35dvh full-brightness banner is DELETED.
          The cover photograph now lives behind the dark hero block under the
          double scrim, and the cover camera control moved into Edit Profile
          (HeaderPhotoCard). The page loses ~340px of dead scroll. */}



      {/* Dark hero block — BRIEF_PROFILE_HERO_AND_TOP10 §1. Replaces the
          124px cover avatar, the name row, the white figure panel, the counts
          line, the handicap trend panel and the trophies row. */}
      {profile?.id && (
        <div className="relative z-10 pointer-events-auto">
          <ProfileHero
            userId={profile.id}
            viewerUserId={user?.id}
            displayName={displayName}
            avatarUrl={profile.profile_photo_url}
            coverUrl={profile.header_photo_url ?? null}
            region={profile.location ?? null}
            isSelf={isSelf}
            indexValue={resolvedHcp.value ?? null}
            roundsCount={shellRoundsCount}
            ratedCount={reviewsCount ?? null}
            friendsCount={isPersonal ? friendsCount : null}
            followersCount={followersCount}
            onAvatarTap={() => (isSelf ? setPhotoSheet('avatar') : setIsAvatarLightboxOpen(true))}
            action={
              isSelfView ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HeroPill label={t('hero.edit', 'Edit')} onClick={() => navigate(editRoute)} />
                  <DropdownMenu onOpenChange={(open) => {
                    if (!open) (document.activeElement as HTMLElement)?.blur();
                  }}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="More options"
                        style={{
                          width: 28,
                          height: 28,
                          flexShrink: 0,
                          borderRadius: 999,
                          background: 'rgba(255,255,255,0.12)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <MoreHorizontal size={15} strokeWidth={2.25} color="#FFFFFF" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: displayName, url: window.location.href }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success('Copied to clipboard');
                        }
                      }}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Copied to clipboard');
                      }}>
                        <Link2 className="w-4 h-4 mr-2" />
                        Copy link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate(editRoute)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/edit-profile?tab=settings')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      {myBusinesses && myBusinesses.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            const biz = myBusinesses[0];
                            navigate(`/business/${biz.business.slug || biz.business.id}`);
                          }}>
                            <Building2 className="w-4 h-4 mr-2" />
                            Switch to business
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : friendshipStatus === 'blocked' ? null : (
                <HeroPill
                  label={
                    isFollowing
                      ? t('hero.following', 'Following')
                      : t('hero.follow', 'Follow')
                  }
                  onClick={toggleFollow}
                  disabled={followBusy}
                />
              )
            }

            onStatTap={(stat) => {
              // Addendum B: the index block and the ROUNDS cell share one
              // destination - the profile's handicap surface. The legacy
              // ?tab=stats id redirects here anyway, so we go straight to it.
              if (stat === 'index' || stat === 'rounds') {
                if (isSelf) navigate('/handicap');
                else if (profileUserId) void resolveMemberTap({ targetUserId: profileUserId });
                return;
              }
              if (stat === 'rated') {
                handleTabChange('courses');
                return;
              }
              // Round 3 §3: the deleted "N followers . N friends" line's
              // destinations now live on the strip.
              if (stat === 'followers') {
                setActiveMiniNav('followers');
                navigate(`/profile/${username}/followers`);
                return;
              }
              if (stat === 'friends') {
                setActiveMiniNav('friends');
                navigate(`/profile/${username}/followers?tab=following&filter=friends`);
              }
            }}
          />
        </div>
      )}


      {/* Action Buttons - other members only. Correction 3: the self "..."
          menu moved INTO the hero identity row beside the EDIT pill, so this
          block (and the white gap it created) no longer renders for self. */}
      {!isSelfView && (
      <div className="mt-3 px-4 flex items-center gap-1.5 sm:gap-2 relative z-10 pointer-events-auto">
        {
          /* ── Other user: Follow + Add Friend + Overflow menu ── */
          friendshipStatus === 'blocked' ? (
            <div className="h-11 flex-1 rounded-full text-sm font-medium flex items-center justify-center" style={{ background: A.PANEL, border: `1px solid ${A.BORDER}`, color: A.MUTE }}>
              Unavailable
            </div>
          ) : (

          <div className="flex flex-col gap-2 w-full">
            {/* Row 1 — Message (primary CTA, full width) */}
            <button
              type="button"
              onClick={() => profileUserId && startConversation({ actorType: 'personal', actorId: profileUserId })}
              disabled={dmStarting}
              className="h-11 w-full rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 px-4 whitespace-nowrap disabled:opacity-60 active:scale-[0.98] transition-transform"
              style={{ background: 'rgba(247,147,30,0.10)', border: '1px solid rgba(247,147,30,0.30)', color: '#F7931E' }}
              aria-label="Send message"
            >
              {dmStarting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <MessageCircle className="w-3.5 h-3.5" />
                  Message
                </>
              )}
            </button>

            {/* Row 2 — Follow + Friend action + overflow menu */}
            <div className="flex items-center gap-2 w-full">
            {viewerActorType !== 'business' && (
            <button 
              className={cn(
                'h-11 flex-1 min-w-0 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5',
                'whitespace-nowrap disabled:opacity-60 active:scale-[0.98] transition-transform border',
                friendshipStatus === 'friends'
                  ? ''
                  : friendshipStatus === 'request_received'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : '',
              )}
              style={
                friendshipStatus === 'friends'
                  ? { background: 'rgba(247,147,30,0.10)', border: '1px solid rgba(247,147,30,0.30)', color: '#F7931E' }
                  : friendshipStatus === 'request_received'
                    ? undefined
                    : { background: A.PANEL, border: `1px solid ${A.BORDER}`, color: A.INK }
              }
              onClick={handleFriendAction}
              disabled={friendshipUpdating}
            >
              {friendshipUpdating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {friendshipStatus === 'friends' ? 'Unfriending…'
                    : friendshipStatus === 'request_sent' ? 'Cancelling…'
                    : friendshipStatus === 'request_received' ? 'Accepting…'
                    : 'Sending…'}
                </>
              ) : friendshipStatus === 'friends' ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  Friends
                </>
              ) : friendshipStatus === 'request_sent' ? (
                <>
                  <UserMinus className="w-3.5 h-3.5" />
                  Requested
                </>
              ) : friendshipStatus === 'request_received' ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  Accept
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Friend
                </>
              )}
            </button>
            )}

            {/* Fix 2: Other user overflow menu */}
            <DropdownMenu onOpenChange={(open) => {
              if (!open) (document.activeElement as HTMLElement)?.blur();
            }}>
              <DropdownMenuTrigger asChild>
                <button 
                  className="w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center focus:outline-none active:scale-[0.97] transition-transform"
                  style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
                >
                  <MoreHorizontal className="w-5 h-5" style={{ color: A.INK }} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: displayName, url: window.location.href }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Copied to clipboard');
                  }
                }}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Copied to clipboard');
                }}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {viewerActorType !== 'business' && friendshipStatus === 'friends' && (
                  <DropdownMenuItem
                    onClick={() => unfriend()}
                    className="text-destructive focus:text-destructive"
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Remove friend
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowBlockDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Block
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
          )
        }
      </div>
      )}


      {/* Round 3 §3: the "N followers . N friends" canvas line is DELETED -
          both counts (and both destinations) now live in the hero's counter
          strip. */}



      {/* White content sheet */}
      <div className="pt-4 pb-22 min-h-[60vh] relative z-10 pointer-events-auto">
        {isPrivateAndLocked ? (
          <PrivateProfileGate
            friendshipStatus={friendshipStatus}
            onSendRequest={sendRequest}
            onCancelRequest={cancelRequest}
            isUpdating={friendshipUpdating}
          />
        ) : (
        <>
        {/* Bio + website chip — on canvas, no card (§3) */}
        {(() => {
          const websiteChips = websites.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {websites.map((website, index) => (
                <a
                  key={index}
                  href={ensureProtocol(website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full px-3 min-h-[44px] active:scale-[0.98]"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${A.BORDER}`,
                    fontFamily: SANS,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: A.INK,
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {formatUrlForDisplay(website)}
                </a>
              ))}
            </div>
          );

          if (profile?.bio) {
            return (
              <section className="px-4 mb-4">
                <div
                  ref={bioRef}
                  className={cn('whitespace-pre-wrap', !bioExpanded && 'line-clamp-6')}
                  style={{
                    fontFamily: SANS,
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    color: A.BODY,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {profile.bio}
                </div>
                {(bioOverflows || bioExpanded) && (
                  <button
                    onClick={() => setBioExpanded(v => !v)}
                    className="mt-1 min-h-[44px] flex items-center gap-1 active:scale-[0.97] transition-transform"
                    style={{
                      fontFamily: SANS,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      color: A.INK,
                    }}
                  >
                    {bioExpanded ? t('bio.readLess', 'Read less') : t('bio.readMore', 'Read more')}
                    <ChevronDown className={cn('w-3.5 h-3.5', bioExpanded && 'rotate-180')} />
                  </button>
                )}
                {websiteChips}
              </section>
            );
          }

          if (isSelf) {
            return (
              <section className="px-4 mb-4">
                <button
                  onClick={() => navigate(editRoute)}
                  className="min-h-[44px] flex items-center active:opacity-70 transition-opacity"
                  style={{
                    fontFamily: SANS,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: A.INK,
                  }}
                >
                  Add a bio
                </button>
                {websiteChips}
              </section>
            );
          }

          if (websites.length > 0) {
            return <section className="px-4 mb-4">{websiteChips}</section>;
          }
          return null;
        })()}


        {/* Social handles row */}
        {(() => {
          const p = (profile ?? {}) as { instagram_handle?: string | null; twitter_handle?: string | null; tiktok_handle?: string | null; youtube_handle?: string | null };
          const links: Array<{ key: string; url: string; icon: React.ReactNode; label: string }> = [];
          if (p.instagram_handle) {
            const h = String(p.instagram_handle).replace(/^@/, '').trim();
            if (h) links.push({ key: 'ig', url: `https://instagram.com/${h}`, icon: <SiInstagram className="w-4 h-4" />, label: `Instagram @${h}` });
          }
          if (p.twitter_handle) {
            const h = String(p.twitter_handle).replace(/^@/, '').trim();
            if (h) links.push({ key: 'x', url: `https://x.com/${h}`, icon: <SiX className="w-4 h-4" />, label: `X @${h}` });
          }
          if (p.tiktok_handle) {
            const h = String(p.tiktok_handle).replace(/^@/, '').trim();
            if (h) links.push({ key: 'tt', url: `https://tiktok.com/@${h}`, icon: <SiTiktok className="w-4 h-4" />, label: `TikTok @${h}` });
          }
          if (p.youtube_handle) {
            const h = String(p.youtube_handle).replace(/^@/, '').trim();
            if (h) links.push({ key: 'yt', url: `https://youtube.com/@${h}`, icon: <SiYoutube className="w-4 h-4" />, label: `YouTube @${h}` });
          }
          if (links.length === 0) return null;
          return (
            <section className="px-4 mb-4">
              <div className="flex flex-wrap gap-2">
                {links.map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    aria-label={l.label}
                    onClick={(e) => { e.preventDefault(); openExternalUrl(l.url); }}
                    className="inline-flex items-center justify-center rounded-full min-h-[44px] min-w-[44px] transition-colors active:scale-[0.96]"
                    style={{ background: A.PANEL, border: `1px solid ${A.BORDER}`, color: A.MUTE }}
                  >
                    {l.icon}
                  </button>
                ))}
              </div>
            </section>
          );
        })()}


        {/* HANDICAP TREND panel + TROPHIES row deleted — the hero owns the
            index, the 12-month trend and the trophies counter. */}


        {/* Personal Top 10 — editorial rail (BRIEF_PROFILE_HERO_AND_TOP10 §4) */}
        {isPersonal && profile?.id && (
          <div className="mt-4 mb-2">
            <ProfileTopTenRail
              userId={profile.id}
              isOwnProfile={isSelf}
              onManage={isSelf ? () => setShowTopTenModal(true) : undefined}
              initialCourseId={deepLinkTopTen.current?.courseId ?? null}
              initialCommentId={deepLinkTopTen.current?.commentId ?? null}
              initialParentCommentId={deepLinkTopTen.current?.parentId ?? null}
            />
            {showTopTenModal && isSelf && (
              <AddCourseModal
                userId={profile.id}
                onClose={() => setShowTopTenModal(false)}
                existingCourseIds={[]}
              />
            )}
          </div>
        )}


        {/* Divider above Clubs section */}
        <div className="px-4 mb-3">
          <div style={{ borderTop: `0.5px solid ${A.BORDER}` }} />
        </div>

        {/* Clubs section */}
        <ClubsSectionWrapper
          profileId={profile?.id}
          viewerId={user?.id}
          isPersonal={isPersonal}
          isSelf={isSelf}
        />

        {/* Achievements Rail removed */}

        {/* Canonical chip tabs */}
        <section
          className="px-4 pt-1 pb-0"
          style={{
            /* One canvas: --background and --bg-page resolve differently, which
               printed a black band behind the tabs. Paint nothing but the page. */
            background: 'var(--bg-page)',
            touchAction: 'auto',
            pointerEvents: 'auto',
          }}
        >
          <div className="flex justify-center">
            <FilterChips
              options={tabs.map((t) => ({ id: t.id, label: t.label }))}
              value={activeSection}
              onChange={(id) => handleTabChange(id)}
              ariaLabel="Profile sections"
            />
          </div>
        </section>

        {/* Tab Content */}
        <div className={cn(activeSection === 'activity' ? 'pt-0 px-0' : activeSection === 'courses' || activeSection === 'stats' ? 'pt-4 px-2.5' : 'pt-4 px-4')}>
          {getCurrentContent()}
        </div>

        {/* Verified accounts informational note — own profile, unverified personal users only */}
        {isSelf && isPersonal && profile && !profile.is_verified_golfer && (
          <div className="px-4 pt-4">
            <VerifiedAccountsNote variant="profile" />
          </div>
        )}
        </>
        )}
      </div>

      {/* Bottom Navigation Spacer */}
      <div style={{ height: 'max(env(safe-area-inset-bottom, 0px), 20px)' }} />

      {/* Avatar Lightbox */}
      <AvatarLightbox
        isOpen={isAvatarLightboxOpen}
        onClose={() => setIsAvatarLightboxOpen(false)}
        imageUrl={profile?.profile_photo_url || ''}
        altText={`${displayName}'s profile photo`}
        shape="squircle"
        fallbackInitial={avatarInitials}
      />

      {/* Block confirmation dialog */}
      {!isSelfView && profileUserId && (
        <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Block {displayName}?</AlertDialogTitle>
              <AlertDialogDescription>
                They won't be able to see your profile or contact you.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={async () => {
                  await blockUser(profileUserId);
                  toast.success(`${displayName} blocked`);
                  navigate(-1);
                }} 
                className="bg-destructive text-destructive-foreground"
              >
                Block
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Report sheet (real submission via submit_report RPC) */}
      {!isSelfView && profileUserId && (
        <ReportSheet
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          reportType="user"
          reportedUserId={profileUserId}
        />
      )}


      {/* Hidden file inputs for inline photo upload (choose + take) */}
      <input ref={avatarFileInputRef} type="file" accept="image/*" onChange={handleAvatarFileSelected} className="hidden" />
      <input ref={avatarTakeInputRef} type="file" accept="image/*" capture="user" onChange={handleAvatarFileSelected} className="hidden" />

      {/* Unified photo action sheet — owner only */}
      {isSelf && (
        <PhotoActionSheet
          open={photoSheet !== null}
          onClose={() => setPhotoSheet(null)}
          title="Profile photo"
          hasPhoto={!!profile?.profile_photo_url}
          removeLabel="Remove profile photo"
          onChoose={() => avatarFileInputRef.current?.click()}
          onTake={() => avatarTakeInputRef.current?.click()}
          onRemove={handleAvatarRemove}
        />
      )}

      {/* Crop Modal */}
      {isCropModalOpen && cropImageSrc && (
        <ImageCropModal
          open={isCropModalOpen}
          onOpenChange={handleCropCancel}
          imageSrc={cropImageSrc}
          aspectRatio={1 / 1.05}
          onCropComplete={handleCropComplete}
          title="Crop Profile Photo"
        />
      )}
      <ScrollToTopGlass />
    </PageRoot>
  );
};

const ProfilePageV2: React.FC = () => {
  const touchDebugEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const forceOff = params.get('touchDebug') === '0' || params.get('touchDebug') === 'false';
    if (forceOff) {
      try { window.localStorage.removeItem('touchDebug'); } catch { /* localStorage unavailable */ }
      return false;
    }
    const byQuery = params.get('touchDebug') === '1' || params.get('touchDebug') === 'true';
    const byStorage = (() => {
      try { return window.localStorage.getItem('touchDebug') === '1'; } catch { return false; }
    })();
    if (byQuery) {
      try { window.localStorage.setItem('touchDebug', '1'); } catch { /* localStorage unavailable */ }
    }
    return byQuery || byStorage;
  }, []);

  return (
    <ProfileTouchDebugProvider enabled={touchDebugEnabled}>
      <ProfileTouchDebugPanel />
      <ProfilePageV2Content />
    </ProfileTouchDebugProvider>
  );
};

export default ProfilePageV2;
