/**
 * ProfilePageV2 - LinkedIn-style Light Profile
 * Exact match to design mock
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { cn } from '@/lib/utils';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEditProfileRoute } from '@/hooks/useEditProfileRoute';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile.tsx';
import { useTop100Overview } from '@/hooks/useTop100Overview';
import PostsTabContent from '@/components/posts-tab/PostsTabContent';
import { usePersonalPostsCount } from '@/hooks/usePersonalPostsCount';
import { usePersonalReviewsCount } from '@/hooks/usePersonalReviewsCount';
import { getProfileType, getProfileTabs } from '@/hooks/useProfileType';
import { useFollowState } from '@/hooks/useFollowState';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useFriendship } from '@/hooks/useFriendship';
import { useSocialCounts } from '@/hooks/useSocialCounts';
import { useRealtimeSocialCounts } from '@/hooks/useRealtimeSocialCounts';
import { useMyBusinesses } from '@/hooks/useMyBusinesses';
import { useBlockActions } from '@/hooks/useBlockActions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trophy, ChevronRight, ChevronDown, ChevronLeft, MoreHorizontal, Send, UserPlus, UserCheck, UserMinus, Check, ExternalLink, Loader2, ArrowLeft, Pencil, Camera, Share2, Link2, Flag, Ban, Settings, Building2, MessageCircle } from 'lucide-react';
import { useStartDM } from '@/hooks/useStartDM';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';
import { PageRoot } from '@/components/layout/PageRoot';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { safeGoBack } from '@/utils/navigation';
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
import { FavouritesCarousel } from '@/components/profile/courses/FavouritesCarousel';
import { AddCourseModal } from '@/components/profile/courses/AddCourseModal';
import { PrivateProfileGate } from '@/components/profile/PrivateProfileGate';
import { CoverPhotoFallback } from '@/components/ui/CoverPhotoFallback';


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
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';
import AchievementsPane from '@/components/profile/AchievementsPane';
import HandicapSection from '@/components/profile/HandicapSection';
import ClubsCard from '@/components/profile/clubs/ClubsCard';
import { useProfileClubs } from '@/components/profile/hooks/useProfileClubs';
import { GolfJourneyProgress } from '@/components/profile/phase6';
import ProfileAchievementsRail from '@/components/profile/ProfileAchievementsRail';
import { AvatarLightbox } from '@/components/shared/AvatarLightbox';
import { ImageCropModal } from '@/components/business/ImageCropModal';
import { ProfileTouchDebugProvider, useProfileTouchDebug } from '@/components/profile/debug/ProfileTouchDebugProvider';
import { CreatorSection } from '@/components/creator-mode/CreatorSection';
import { CreatorBadge } from '@/components/creator-mode/CreatorBadge';
import { ProfileTouchDebugPanel } from '@/components/profile/debug/ProfileTouchDebugPanel';

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
    <section className="px-5 mb-4">
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

  const { logPoint } = useProfileTouchDebug();
  
  // Hide global header for full-bleed immersive profile
  useHideHeader();
  // Re-apply status bar when returning from fullscreen media viewer
  const [statusBarKey, setStatusBarKey] = useState(0);
  useEffect(() => {
    const handler = () => setStatusBarKey(k => k + 1);
    window.addEventListener('media-viewer-closed', handler);
    return () => window.removeEventListener('media-viewer-closed', handler);
  }, []);
  // Transparent status bar for immersive hero bleed into safe area
  useMedianStatusBar("dark", "transparent", true, false, true, statusBarKey);
  
  // If viewing via /profile/:username, fetch that profile; otherwise show own profile
  // Resolve profileUserId — cached query for username routes, synchronous for own profile
  const { data: resolvedProfileId, isLoading: isResolvingId } = useQuery({
    queryKey: ['profile-id-by-username', routeUsername],
    enabled: !!routeUsername,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const query = supabase.from('user_profiles').select('id, deleted_at');
      const { data, error } = await (isUuid(routeUsername!)
        ? query.eq('id', routeUsername!)
        : query.eq('username', routeUsername!)
      ).maybeSingle();
      if (error || !data) return { id: null as string | null, deleted: false, notFound: true };
      if (data.deleted_at != null) return { id: null as string | null, deleted: true, notFound: false };
      return { id: data.id, deleted: false, notFound: false };
    },
  });

  const profileUserId: string | undefined = routeUsername
    ? (resolvedProfileId?.id ?? undefined)
    : user?.id;
  const isProfileDeleted = resolvedProfileId?.deleted === true;
  const profileNotFound = resolvedProfileId?.notFound === true;
  
  const { data: profile, isLoading: profileLoading } = useUserProfile(profileUserId);
  const { data: top100Overview } = useTop100Overview(profileUserId);
  const { data: postsCount = 0, isLoading: postsCountLoading } = usePersonalPostsCount(profileUserId);
  const { data: reviewsCount = 0, isLoading: reviewsCountLoading } = usePersonalReviewsCount(profileUserId);
  const { data: achievements } = useProfileAchievements(profileUserId);
  
  const isSelf = user?.id === profileUserId;
  

  const followToggle = useToggleFollow();
  const { isFollowing: cachedFollowing } = useFollowState({
    targetActorType: 'personal',
    targetActorId: isSelf ? undefined : profileUserId,
    viewerActorType: 'personal',
    viewerActorId: user?.id,
  });
  const isFollowing = cachedFollowing ?? false;
  const followBusy = followToggle.isPending;
  const toggleFollow = () => {
    if (isSelf || !user?.id || !profileUserId) return;
    followToggle.mutate({
      targetActorType: 'personal',
      targetActorId: profileUserId,
      targetUserId: profileUserId,
      viewerActorType: 'personal',
      viewerActorId: user.id,
      viewerUserId: user.id,
      isFollowing,
    });
  };

  const { startDM, isStarting: dmStarting } = useStartDM();
  const {
    status: friendshipStatus,
    isUpdating: friendshipUpdating,
    sendRequest,
    cancelRequest,
    acceptRequest,
    declineRequest,
    unfriend,
  } = useFriendship(isSelf ? undefined : profileUserId);

  const isPrivateAndLocked =
    !isSelf &&
    profile?.is_public === false &&
    friendshipStatus !== 'friends';

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = useMemo(() => {
    const tabParam = searchParams.get('tab');
    const validTabs = ['activity', 'courses', 'top100', 'handicap', 'achievements', 'stats'];
    return tabParam && validTabs.includes(tabParam) ? tabParam : 'activity';
  }, []);
  
  const [activeSection, setActiveSection] = useState(initialTab);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [activeMiniNav, setActiveMiniNav] = useState('posts');
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showTopTenModal, setShowTopTenModal] = useState(false);

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<'avatar' | 'hero' | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const profileTypeInfo = getProfileType(profile?.user_type);
  const { isPersonal } = profileTypeInfo;
  const tabs = getProfileTabs(profile?.user_type);

  const { data: socialCounts, isLoading: socialCountsLoading } = useSocialCounts(profileUserId);
  const followersCount = socialCounts?.followers ?? 0;
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
    setCropMode('avatar');
    setIsCropModalOpen(true);
    if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
  };

  const handleHeroFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropImageSrc(URL.createObjectURL(file));
    setCropMode('hero');
    setIsCropModalOpen(true);
    if (heroFileInputRef.current) heroFileInputRef.current.value = '';
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

  const handleHeroUpload = async (croppedFile: File) => {
    if (!user?.id) return;
    setIsUploadingHero(true);
    try {
      const fileExt = croppedFile.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/header-${Date.now()}.${fileExt}`;
      const result = await uploadToR2Only(croppedFile, 'clbhouz-profile-images', fileName);
      if (!result.success) throw new Error(result.error || 'Upload failed');
      const { error: updateError } = await supabase.from('user_profiles').update({ header_photo_url: result.publicUrl }).eq('id', user.id);
      if (updateError) {
        console.error('[ProfilePage] Cover DB update failed:', updateError);
        toast.error('Failed to save cover photo. Please try again.');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['user-profile', profileUserId] });
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      toast.success('Cover photo updated');
    } catch (err) {
      console.error('[ProfilePage] Cover upload error:', err);
      toast.error('Failed to update cover photo');
    } finally {
      setIsUploadingHero(false);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    setIsCropModalOpen(false);
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
    if (cropMode === 'avatar') handleAvatarUpload(croppedFile);
    if (cropMode === 'hero') handleHeroUpload(croppedFile);
    setCropMode(null);
  };

  const handleCropCancel = (open: boolean) => {
    if (!open) {
      if (cropImageSrc) {
        URL.revokeObjectURL(cropImageSrc);
        setCropImageSrc(null);
      }
      setIsCropModalOpen(false);
      setCropMode(null);
    }
  };

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
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading || (!!routeUsername && isResolvingId) || profileLoading) {
    return <ProfileSkeleton />;
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
  const username = profile?.username || 'user';
  const heroUrl = profile?.header_photo_url || profile?.profile_photo_url || '';
  const top100Count = top100Overview?.total_played ?? 0;
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
      case 'top100':
        return (
          <Top100MyProgressPanel userId={profile?.id} />
        );
      case 'achievements':
        return (
          <AchievementsPane 
            userId={profile?.id}
            userDisplayName={profile?.display_name || 'User'}
            userHandicap={profile?.eg_handicap_index}
            userProfilePhotoUrl={profile?.profile_photo_url}
            isCurrentUser={isSelf}
          />
        );
      case 'stats':
        return (
          <HandicapSection 
            userId={profile?.id || ''}
            profile={profile}
            isOwnProfile={isSelf}
          />
        );
      default:
        return null;
    }
  };

  return (
    <PageRoot className="min-h-screen" style={{ background: BG_COLOR }} immersiveStatusBar immersive>
      {/* Hero Section - full-bleed immersive, extends behind notch */}
      <div className="relative pointer-events-none" style={{ zIndex: 1 }}>
        {/* Hero Image Container - full-bleed behind notch */}
        <div className="relative w-full overflow-hidden" style={{ height: '35dvh' }}>
          {heroUrl ? (
            <img 
              src={heroUrl} 
              alt="Profile cover" 
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <CoverPhotoFallback className="w-full h-full" />
          )}
          {/* Cover photo edit affordance — self-profile only */}
          {isSelf && (
            <button
              onClick={() => heroFileInputRef.current?.click()}
              className="absolute bottom-3 right-3 h-11 w-11 rounded-full flex items-center justify-center active:scale-[0.97] z-10 pointer-events-auto transition-transform"
              style={{
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              aria-label="Change cover photo"
              disabled={isUploadingHero}
            >
              {isUploadingHero ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </button>
          )}
        </div>

        {/* Glass back button - matches course detail hero style */}
        <button
          type="button"
          onClick={() => safeGoBack(navigate, '/clubhouse')}
          className="absolute left-4 flex h-[34px] w-[34px] items-center justify-center active:scale-95 transition-all z-10 pointer-events-auto"
          style={{
            top: 'calc(max(var(--sat, env(safe-area-inset-top, 0px)), 47px) + 12px)',
            borderRadius: '12px',
            background: 'rgba(0, 0, 0, 0.28)',
            backdropFilter: 'blur(22px) saturate(180%)',
            WebkitBackdropFilter: 'blur(22px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
          }}
          aria-label="Back"
        >
          <ChevronLeft className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
        </button>

        {/* Avatar - squircle, left-aligned */}
        <div
          className="absolute left-5 z-20 pointer-events-auto"
          style={{ bottom: '-62px' }}
        >
          <button
            className="relative w-[124px] h-[124px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F7931E] focus-visible:ring-offset-2 rounded-[34%] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            data-debug-id="profile-photo"
            onPointerDown={(e) => {
              logPoint('profile_photo.pointerdown', { x: e.clientX, y: e.clientY });
            }}
            onClick={() => {
              if (isUploadingAvatar) return;
              logPoint('profile_photo.click');
              if (isSelf) {
                avatarFileInputRef.current?.click();
              } else {
                setIsAvatarLightboxOpen(true);
              }
            }}
            aria-label={isSelf ? "Change profile photo" : "View profile photo"}
          >
            {/* 2px ring (matches background) */}
            <div className="clbhouz-squircle absolute inset-0 bg-background" />

            {/* Avatar image */}
            <div
              className="clbhouz-squircle absolute overflow-hidden"
              style={{
                inset: '2px',
                boxShadow: '0 12px 30px rgba(15,15,15,0.22)',
              }}
            >
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground">
                  {displayName.charAt(0)}
                </div>
              )}
            </div>

            {/* Camera badge — bottom right, Instagram style */}
            {isSelf && !isUploadingAvatar && (
              <div
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center z-10"
                style={{
                  background: 'rgba(0, 0, 0, 0.55)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '2px solid white',
                }}
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            {/* Spinner badge — shows during upload */}
            {isSelf && isUploadingAvatar && (
              <div
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center z-10"
                style={{
                  background: 'rgba(0, 0, 0, 0.55)',
                  border: '2px solid white',
                }}
              >
                <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </button>
        </div>

        {/* HCP pill - right side, just below header photo */}
        <div className="absolute right-5 z-20 flex items-center gap-2 pointer-events-auto" style={{ top: 'calc(35dvh + 12px)' }}>
          {/* HCP pill - white, bigger size */}
          {profile?.eg_handicap_index != null && (
            <span 
             className="px-4 py-1.5 text-sm font-semibold rounded-full text-foreground flex items-center justify-center"
              style={{ 
                background: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(31, 36, 40, 0.08)'
              }}
            >
              HCP {formatHandicap(profile.eg_handicap_index)}
            </span>
          )}
        </div>
      </div>

      {/* Identity Stack - adjusted for left-aligned avatar */}
      <div className="pt-[68px] px-5 text-left relative z-10 pointer-events-auto">
        {/* Name + Creator Badge */}
        <div className="flex items-center gap-2">
          <h1 className="text-[28px] text-foreground" style={{ fontWeight: 900, letterSpacing: '-0.03em' }}>
            {displayName}
          </h1>
          {profile?.is_creator && <CreatorBadge />}
        </div>
      </div>

      {/* Action Buttons - different for self vs other */}
      <div className="mt-3 px-5 flex items-center gap-1.5 sm:gap-2 relative z-10 pointer-events-auto">
        {isSelf ? (
          /* ── Self-profile: prominent Edit Profile + overflow menu ── */
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => navigate(editRoute)}
              className="flex-1 h-11 rounded-full font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)', color: '#0F172A' }}
            >
              <Pencil className="w-4 h-4" />
              Edit Profile
            </button>
            {/* Fix 3: Expanded self overflow menu */}
            <DropdownMenu onOpenChange={(open) => {
              if (!open) (document.activeElement as HTMLElement)?.blur();
            }}>
              <DropdownMenuTrigger asChild>
                <button 
                  className="w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center focus:outline-none active:scale-[0.97] transition-transform"
                  style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}
                >
                  <MoreHorizontal className="w-5 h-5 text-foreground" />
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
                <DropdownMenuItem onClick={() => navigate('/settings')}>
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
        ) : (
          /* ── Other user: Follow + Add Friend + Overflow menu ── */
          friendshipStatus === 'blocked' ? (
            <div className="h-11 flex-1 rounded-full text-sm font-medium flex items-center justify-center text-[#94A3B8]" style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}>
              Unavailable
            </div>
          ) : (
          <>
            <button
              type="button"
              onClick={() => profileUserId && startDM(profileUserId)}
              disabled={dmStarting === profileUserId}
              className="h-11 flex-1 min-w-0 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 px-4 whitespace-nowrap disabled:opacity-60 active:scale-[0.98] transition-transform"
              style={{ background: 'rgba(247,147,30,0.10)', border: '1px solid rgba(247,147,30,0.30)', color: '#F7931E' }}
              aria-label="Send message"
            >
              {dmStarting === profileUserId ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <MessageCircle className="w-3.5 h-3.5" />
                  Message
                </>
              )}
            </button>
            <button 
              className="h-11 flex-1 min-w-0 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-60 active:scale-[0.98] transition-transform"
              style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', color: '#0F172A' }}
              onClick={toggleFollow}
              disabled={followBusy || (isFollowing === 'unknown' && !followResolved)}
            >
              {followBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isFollowing === 'following' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Following
                </>
              ) : (
                'Follow'
              )}
            </button>
            
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
                    : { background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', color: '#0F172A' }
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

            {/* Fix 2: Other user overflow menu */}
            <DropdownMenu onOpenChange={(open) => {
              if (!open) (document.activeElement as HTMLElement)?.blur();
            }}>
              <DropdownMenuTrigger asChild>
                <button 
                  className="w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center focus:outline-none active:scale-[0.97] transition-transform"
                  style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}
                >
                  <MoreHorizontal className="w-5 h-5 text-foreground" />
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
                {friendshipStatus === 'friends' && (
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
          </>
          )
        )}
      </div>

      {/* Mini-nav row: Posts | Followers | Friends */}
      <div className="mt-3 px-5 relative z-10 pointer-events-auto">
        <motion.div 
          className="flex items-center justify-evenly"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } }
          }}
        >
          {/* Posts */}
          <motion.button
            onClick={() => setActiveMiniNav('posts')}
            className="pb-3 flex flex-col items-center text-center min-h-[44px] rounded-lg active:scale-[0.97] transition-transform"
            variants={{
              hidden: { opacity: 0, y: 4 },
              show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }
            }}
          >
            <AnimatedNumber 
              value={postsCount} 
              isLoading={postsCountLoading}
              minCh={2}
              className="text-base font-semibold text-foreground"
            />
            <span className="text-xs text-muted-foreground">Posts</span>
          </motion.button>
          
          <div className="w-px h-6 self-center" style={{ background: 'rgba(15,23,42,0.08)' }} />

          {/* Reviews */}
          <motion.button
            onClick={() => setActiveMiniNav('posts')}
            className="pb-3 flex flex-col items-center text-center min-h-[44px] rounded-lg active:scale-[0.97] transition-transform"
            variants={{
              hidden: { opacity: 0, y: 4 },
              show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }
            }}
          >
            <AnimatedNumber 
              value={reviewsCount} 
              isLoading={reviewsCountLoading}
              minCh={2}
              className="text-base font-semibold text-foreground"
            />
            <span className="text-xs text-muted-foreground">Reviews</span>
          </motion.button>
          
          <div className="w-px h-6 self-center" style={{ background: 'rgba(15,23,42,0.08)' }} />
          
          {/* Followers */}
          <motion.button
            onClick={() => {
              setActiveMiniNav('followers');
              navigate(`/profile/${username}/followers`);
            }}
            className="pb-3 flex flex-col items-center text-center min-h-[44px] rounded-lg active:scale-[0.97] transition-transform"
            variants={{
              hidden: { opacity: 0, y: 4 },
              show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }
            }}
          >
            <AnimatedNumber 
              value={followersCount} 
              isLoading={socialCountsLoading} 
              minCh={2}
              className="text-base font-semibold text-foreground"
            />
            <span className="text-xs text-muted-foreground">Followers</span>
          </motion.button>
          
          {isPersonal && <div className="w-px h-6 self-center" style={{ background: 'rgba(15,23,42,0.08)' }} />}
          
          {/* Friends */}
          {isPersonal && (
            <motion.button
              onClick={() => {
                setActiveMiniNav('friends');
                navigate(`/profile/${username}/followers?tab=following&filter=friends`);
              }}
              className="pb-3 flex flex-col items-center text-center min-h-[44px] rounded-lg active:scale-[0.97] transition-transform"
              variants={{
                hidden: { opacity: 0, y: 4 },
                show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }
              }}
            >
              <AnimatedNumber 
                value={friendsCount} 
                isLoading={socialCountsLoading} 
                minCh={2}
                className="text-base font-semibold text-foreground"
              />
              <span className="text-xs text-muted-foreground">Friends</span>
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* White content sheet */}
      <div className="pt-4 pb-32 min-h-[60vh] relative z-10 pointer-events-auto">
        {isPrivateAndLocked ? (
          <PrivateProfileGate
            friendshipStatus={friendshipStatus}
            onSendRequest={sendRequest}
            onCancelRequest={cancelRequest}
            isUpdating={friendshipUpdating}
          />
        ) : (
        <>
        {/* About section */}
        {profile?.bio ? (
          <section className="px-5 mb-4">
            <div 
              className={cn(
                "text-base text-foreground leading-relaxed whitespace-pre-wrap",
                !bioExpanded && "line-clamp-6"
              )} 
              style={{ overflowWrap: 'anywhere' }}
            >
              {profile.bio}
            </div>
            {(profile.bio.length > 200 || profile.bio.split('\n').length > 4) && !bioExpanded && (
              <button 
                onClick={() => setBioExpanded(true)}
                className="text-[0.8125rem] font-semibold mt-1 min-h-[44px] flex items-center gap-0.5 active:scale-[0.97] transition-transform"
                style={{ color: '#F7931E' }}
              >
                Read more
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
            )}
            
            {/* Websites as pills - directly under bio */}
            {websites.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {websites.map((website, index) => (
                  <a
                    key={index}
                    href={ensureProtocol(website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full px-3 min-h-[44px] text-sm font-semibold text-[#64748B] hover:text-foreground transition-colors active:scale-[0.98]"
                    style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {formatUrlForDisplay(website)}
                  </a>
                ))}
              </div>
            )}
          </section>
        ) : isSelf ? (
          <section className="px-5 mb-4">
            <button
              onClick={() => navigate(editRoute)}
              className="text-sm font-medium italic min-h-[44px] flex items-center active:opacity-70 transition-opacity"
              style={{ color: '#F7931E' }}
            >
              Add a bio
            </button>
            {/* Websites as pills even without bio */}
            {websites.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {websites.map((website, index) => (
                  <a
                    key={index}
                    href={ensureProtocol(website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full px-3 min-h-[44px] text-sm font-semibold text-[#64748B] hover:text-foreground transition-colors active:scale-[0.98]"
                    style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {formatUrlForDisplay(website)}
                  </a>
                ))}
              </div>
            )}
          </section>
        ) : websites.length > 0 ? (
          <section className="px-5 mb-4">
            <div className="flex flex-wrap gap-2">
              {websites.map((website, index) => (
                <a
                  key={index}
                  href={ensureProtocol(website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full px-3 min-h-[44px] text-sm font-semibold text-[#64748B] hover:text-foreground transition-colors active:scale-[0.98]"
                  style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {formatUrlForDisplay(website)}
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {/* Personal Top 10 Carousel */}
        {isPersonal && profile?.id && (
          <div className="mt-4 mb-2">
            <FavouritesCarousel
              userId={profile.id}
              isOwnProfile={isSelf}
              onManage={isSelf ? () => setShowTopTenModal(true) : undefined}
              displayName={profile.display_name ?? profile.username ?? undefined}
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
        <div className="px-5 mb-3">
          <div style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)' }} />
        </div>

        {/* Clubs section */}
        <ClubsSectionWrapper
          profileId={profile?.id}
          viewerId={user?.id}
          isPersonal={isPersonal}
          isSelf={isSelf}
        />

        {/* Achievements Rail */}
        {isPersonal && profile?.id && username && (
          <ProfileAchievementsRail
            userId={profile.id}
            username={username}
            isOwnProfile={isSelf}
            className="mb-4"
          />
        )}

        {/* Creator Section */}
        {isPersonal && profileUserId && (
          <CreatorSection userId={profileUserId} isOwnProfile={isSelf} />
        )}

        {/* Segmented control tabs */}
        <section 
          className="px-4 py-2"
          style={{ 
            background: 'hsl(var(--background))',
            touchAction: 'auto',
            pointerEvents: 'auto',
          }}
        >
          <div 
            className="flex items-center gap-1 w-full"
          >
            {tabs.map((tab) => {
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "relative py-1.5 px-2 text-sm transition-colors duration-200 whitespace-nowrap min-h-[44px] active:scale-[0.98] flex-1",
                    isActive
                      ? "font-extrabold"
                      : "font-medium hover:text-foreground"
                  )}
                  style={{
                    touchAction: 'auto',
                    background: 'transparent',
                    border: 'none',
                    color: isActive ? '#0F172A' : '#94A3B8',
                    letterSpacing: isActive ? '-0.01em' : 0,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Tab Content */}
        <div className={cn("pt-3.5", activeSection === 'activity' ? 'px-0' : activeSection === 'courses' ? 'px-2.5' : 'px-5')}>
          {getCurrentContent()}
        </div>
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
        fallbackInitial={displayName?.charAt(0)}
      />

      {/* Block confirmation dialog */}
      {!isSelf && profileUserId && (
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

      {/* Report confirmation dialog */}
      {!isSelf && profileUserId && (
        <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Report {displayName}?</AlertDialogTitle>
              <AlertDialogDescription>
                We'll review this profile and take action if it violates our Community Guidelines.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                toast.success('Report submitted. Thank you.');
                setShowReportDialog(false);
              }}>
                Submit Report
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Hidden file inputs for inline photo upload */}
      <input ref={avatarFileInputRef} type="file" accept="image/*" onChange={handleAvatarFileSelected} className="hidden" />
      <input ref={heroFileInputRef} type="file" accept="image/*" onChange={handleHeroFileSelected} className="hidden" />

      {/* Crop Modal */}
      {isCropModalOpen && cropImageSrc && (
        <ImageCropModal
          open={isCropModalOpen}
          onOpenChange={handleCropCancel}
          imageSrc={cropImageSrc}
          aspectRatio={cropMode === 'hero' ? window.innerWidth / (window.innerHeight * 0.35) : 1 / 1.05}
          onCropComplete={handleCropComplete}
          title={cropMode === 'hero' ? 'Crop Cover Photo' : 'Crop Profile Photo'}
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
      try { window.localStorage.removeItem('touchDebug'); } catch {}
      return false;
    }
    const byQuery = params.get('touchDebug') === '1' || params.get('touchDebug') === 'true';
    const byStorage = (() => {
      try { return window.localStorage.getItem('touchDebug') === '1'; } catch { return false; }
    })();
    if (byQuery) {
      try { window.localStorage.setItem('touchDebug', '1'); } catch {}
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
