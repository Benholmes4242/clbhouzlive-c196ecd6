/**
 * ProfilePageV2 - LinkedIn-style Light Profile
 * Exact match to design mock
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { cn } from '@/lib/utils';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile.tsx';
import { useTop100Overview } from '@/hooks/useTop100Overview';
import { useActivityPostsV2 } from '@/components/profile/activity/v2';
import { usePersonalPostsCount } from '@/hooks/usePersonalPostsCount';
import { getProfileType, getProfileTabs } from '@/hooks/useProfileType';
import { useFollow } from '@/hooks/useFollow';
import { useFriendship } from '@/hooks/useFriendship';
import { useSocialCounts } from '@/hooks/useSocialCounts';
import { useRealtimeSocialCounts } from '@/hooks/useRealtimeSocialCounts';
import { useMyBusinesses } from '@/hooks/useMyBusinesses';
import { useBlockActions } from '@/hooks/useBlockActions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trophy, ChevronRight, ChevronDown, MoreHorizontal, Send, UserPlus, Check, ExternalLink, Loader2, ArrowLeft, Pencil, Camera, Share2, Link2, Flag, Ban, Settings, Building2 } from 'lucide-react';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { safeGoBack } from '@/utils/navigation';

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
import ActivityFeed from '@/components/profile/ActivityFeed';
import { ProfileCoursesTab } from '@/components/profile/ProfileCoursesTab';
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';
import AchievementsPane from '@/components/profile/AchievementsPane';
import HandicapSection from '@/components/profile/HandicapSection';
import ClubsCard from '@/components/profile/clubs/ClubsCard';
import { useProfileClubs } from '@/components/profile/hooks/useProfileClubs';
import { GolfJourneyProgress } from '@/components/profile/phase6';
import ProfileAchievementsRail from '@/components/profile/ProfileAchievementsRail';
import { AvatarLightbox } from '@/components/shared/AvatarLightbox';
import { ProfileTouchDebugProvider, useProfileTouchDebug } from '@/components/profile/debug/ProfileTouchDebugProvider';
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
        onEditClick={() => navigate('/edit-profile')}
      />
    </section>
  );
};

const ProfilePageV2Content: React.FC = () => {
  const navigate = useNavigate();
  const { username: routeUsername } = useParams<{ username?: string }>();
  const { user, loading: authLoading } = useSupabaseSession();

  const { logPoint } = useProfileTouchDebug();
  
  // Hide global header for full-bleed immersive profile
  useHideHeader();
  // Transparent status bar for immersive hero bleed into safe area
  useMedianStatusBar("dark", "transparent", true, false);
  
  // If viewing via /profile/:username, fetch that profile; otherwise show own profile
  const [profileUserId, setProfileUserId] = useState<string | undefined>(undefined);
  const [isProfileDeleted, setIsProfileDeleted] = useState(false);
  const [profileNotFound, setProfileNotFound] = useState(false);
  
  useEffect(() => {
    const fetchProfileByUsernameOrId = async () => {
      setIsProfileDeleted(false);
      setProfileNotFound(false);
      
      if (routeUsername) {
        // Support both UUID and username in route param
        // Fetch id and deleted_at to check if profile exists and is active
        const query = supabase.from('user_profiles').select('id, deleted_at');
        const { data, error } = await (isUuid(routeUsername)
          ? query.eq('id', routeUsername)
          : query.eq('username', routeUsername)
        ).maybeSingle();
        
        if (error || !data) {
          setProfileNotFound(true);
          setProfileUserId(undefined);
        } else if (data.deleted_at != null) {
          // Profile is soft-deleted
          setIsProfileDeleted(true);
          setProfileUserId(undefined);
        } else {
          setProfileUserId(data.id);
        }
      } else {
        setProfileUserId(user?.id);
      }
    };
    fetchProfileByUsernameOrId();
  }, [routeUsername, user?.id]);
  
  const { data: profile, isLoading: profileLoading } = useUserProfile(profileUserId);
  const { data: top100Overview } = useTop100Overview(profileUserId);
  const { items: posts } = useActivityPostsV2(profileUserId);
  const { data: postsCount = 0, isLoading: postsCountLoading } = usePersonalPostsCount(profileUserId);
  const { data: achievements } = useProfileAchievements(profileUserId);
  
  // Determine if viewing own profile
  const isSelf = user?.id === profileUserId;
  

  // Follow and friendship hooks for other users
  const { isFollowing, busy: followBusy, toggle: toggleFollow, ensureInitial } = useFollow(isSelf ? undefined : profileUserId);
  const { status: friendshipStatus, isUpdating: friendshipUpdating, sendRequest, cancelRequest } = useFriendship(isSelf ? undefined : profileUserId);
  
  // Initialize follow state
  useEffect(() => {
    if (!isSelf && profileUserId) {
      ensureInitial();
    }
  }, [isSelf, profileUserId, ensureInitial]);
  
  // Fix 4: Read initial tab from URL search params
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = useMemo(() => {
    const tabParam = searchParams.get('tab');
    const validTabs = ['activity', 'courses', 'top100', 'handicap', 'achievements', 'stats'];
    return tabParam && validTabs.includes(tabParam) ? tabParam : 'activity';
  }, []); // Only read on mount
  
  const [activeSection, setActiveSection] = useState(initialTab);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [activeMiniNav, setActiveMiniNav] = useState('posts');
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  const profileTypeInfo = getProfileType(profile?.user_type);
  const { isPersonal } = profileTypeInfo;
  const tabs = getProfileTabs(profile?.user_type);

  // Fix 5: Use React Query for social counts instead of raw useEffect
  const { data: socialCounts, isLoading: socialCountsLoading } = useSocialCounts(profileUserId);
  const followersCount = socialCounts?.followers ?? 0;
  const followingCount = socialCounts?.following ?? 0;
  const friendsCount = isPersonal ? (socialCounts?.friends ?? 0) : 0;
  
  // Enable real-time updates for social counts
  useRealtimeSocialCounts({
    viewerUserId: user?.id ?? null,
    profileUserId: profileUserId ?? null,
  });

  // Block actions for other users
  const { blockUser } = useBlockActions({ currentUserId: user?.id || '' });

  // Check if user has business profiles (for "Switch to business" menu item)
  const { data: myBusinesses } = useMyBusinesses(isSelf ? user?.id : undefined);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveSection(tab);
    if (tab === 'activity') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  // postsCount now comes from usePersonalPostsCount (fetches total from DB)
  const unlockedAchievements = achievements || [];

  // Format handicap with 1 decimal place
  const formatHandicap = (hcp: number | null | undefined): string => {
    if (hcp == null) return '–';
    return hcp.toFixed(1);
  };
  
  // Format URL for display (domain only)
  const formatUrlForDisplay = (url: string): string => {
    if (!url) return '';
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    }
  };
  
  // Ensure URL has protocol for linking
  const ensureProtocol = (url: string): string => {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
  };
  
  // Get friend button label based on status
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
  
  // Handle friend button click
  const handleFriendAction = async () => {
    if (friendshipStatus === 'none') {
      await sendRequest();
    } else if (friendshipStatus === 'request_sent') {
      await cancelRequest();
    }
    // For 'friends' and 'request_received', we might want different actions
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
      </div>
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
            className="px-6 py-2 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-colors"
          >
            Go back
          </button>
        </div>
      </PageRoot>
    );
  }

  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  const displayName = profile?.display_name || 'Golfer';
  const username = profile?.username || 'user';
  const heroUrl = profile?.header_photo_url || profile?.profile_photo_url || '';
  const top100Count = top100Overview?.total_played ?? 0;
  const websites = profile?.websites || [];

  const getCurrentContent = () => {
    switch (activeSection) {
      case 'activity':
        return (
          <ActivityFeed
            userId={profile?.id || ''}
            isOwnProfile={isSelf}
            profileDisplayName={profile?.display_name}
            userHandicap={profile?.eg_handicap_index}
            userProfilePhotoUrl={profile?.profile_photo_url}
            onAchievementsClick={() => setActiveSection('achievements')}
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
      {/* pointer-events: none on container allows clicks to pass through to content below */}
      {/* Children with pointer-events: auto remain interactive */}
      <div className="relative pointer-events-none" style={{ zIndex: 1 }}>
        {/* Hero Image Container - full-bleed behind notch */}
        <div className="relative w-full overflow-hidden" style={{ height: '35dvh' }}>
          {heroUrl ? (
            <img 
              src={heroUrl} 
              alt="Profile cover" 
              className="w-full h-full object-cover object-bottom"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/40" />
          )}
          {/* Cover photo edit affordance — self-profile only */}
          {isSelf && (
            <button
              onClick={() => navigate('/edit-profile')}
              className="absolute bottom-3 right-3 h-9 w-9 rounded-full flex items-center justify-center active:scale-[0.95] z-10 pointer-events-auto transition-transform"
              style={{
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              aria-label="Change cover photo"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
          )}
        </div>

        {/* Glass back button - positioned below safe area */}
        <button
          type="button"
          onClick={() => safeGoBack(navigate, '/clubhouse')}
          className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-full active:scale-95 transition-all z-10 pointer-events-auto"
          style={{
            top: 'calc(1rem + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))',
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4 text-white" />
        </button>

        {/* Avatar - squircle, left-aligned with About title (px-5), positioned relative to hero bottom */}
        {/* Positioned absolutely but OUTSIDE the overflow-hidden container */}
        <button
          className="absolute left-5 z-20 cursor-pointer pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-[34%] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ bottom: '-62px' }}
          data-debug-id="profile-photo"
          onPointerDown={(e) => {
            logPoint('profile_photo.pointerdown', { x: e.clientX, y: e.clientY });
          }}
          onTouchStart={(e) => {
            const t = e.touches?.[0];
            logPoint('profile_photo.pointerdown', { x: t?.clientX, y: t?.clientY, via: 'touchstart' });
          }}
          onClick={() => {
            logPoint('profile_photo.click');
            setIsAvatarLightboxOpen(true);
          }}
          aria-label="View profile photo"
        >
          <div className="relative w-[124px] h-[124px]">
            {/* 2px ring (matches background) */}
            <div
              className="clbhouz-squircle absolute inset-0 bg-background"
            />

            {/* Avatar */}
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
            {/* Avatar edit affordance — self-profile only */}
            {isSelf && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/edit-profile'); }}
                className="absolute bottom-0 right-0 h-7 w-7 rounded-full flex items-center justify-center active:scale-[0.95] z-30 pointer-events-auto transition-transform"
                style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                aria-label="Change profile photo"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>
        </button>

        {/* HCP + Golfer pills - right side, just below header photo */}
        {/* Reduced gap: mt-3 → mt-2 (8px from golfer badge to next element) */}
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
          
          {/* Golfer pill - transparent green glass, bigger size */}
          <span 
            className="px-4 py-1.5 text-sm font-semibold rounded-full text-emerald-700 flex items-center justify-center"
            style={{ 
              background: 'rgba(52, 199, 89, 0.15)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(52, 199, 89, 0.3)'
            }}
          >
            Golfer
          </span>
        </div>
      </div>

      {/* Identity Stack - adjusted for left-aligned avatar */}
      {/* z-10 ensures content is above hero's z-1, pointer-events-auto ensures tappability */}
      <div className="pt-[68px] px-5 text-left relative z-10 pointer-events-auto">
        {/* Name - smaller, more bold */}
        <h1 className="text-[28px] font-semibold text-foreground">
          {displayName}
        </h1>
      </div>

      {/* Action Buttons - different for self vs other */}
      {/* relative z-10 ensures buttons are above hero overlay */}
      <div className="mt-3 px-5 flex items-center gap-2 relative z-10 pointer-events-auto">
        {isSelf ? (
          /* ── Self-profile: prominent Edit Profile + overflow menu ── */
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => navigate('/edit-profile')}
              className="flex-1 h-11 rounded-full bg-muted text-foreground font-medium text-sm flex items-center justify-center gap-2 border border-border active:scale-[0.98] transition-transform"
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
                  className="w-11 h-11 flex-shrink-0 rounded-full bg-muted flex items-center justify-center border border-border focus:outline-none active:scale-[0.95] transition-transform"
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
                <DropdownMenuItem onClick={() => navigate('/edit-profile')}>
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
          <>
            <button 
              className="h-11 flex-1 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60 active:scale-[0.98] transition-transform"
              style={{ background: isFollowing === 'following' ? '#334155' : 'hsl(var(--destructive))' }}
              onClick={toggleFollow}
              disabled={followBusy || isFollowing === 'unknown'}
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
              className="h-11 flex-1 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60 active:scale-[0.98] transition-transform border border-border"
              style={{
                background: friendshipStatus === 'friends' ? '#dcfce7' : undefined,
                color: friendshipStatus === 'friends' ? '#166534' : undefined
              }}
              onClick={handleFriendAction}
              disabled={friendshipUpdating || friendshipStatus === 'friends'}
            >
              {friendshipUpdating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : friendshipStatus === 'friends' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Friends
                </>
              ) : friendshipStatus === 'request_sent' ? (
                'Requested'
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
                  className="w-11 h-11 flex-shrink-0 rounded-full bg-muted flex items-center justify-center border border-border focus:outline-none active:scale-[0.95] transition-transform"
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
                <DropdownMenuItem onClick={() => toast.info('Report submitted')}>
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
        )}
      </div>

      {/* Mini-nav row: Posts | Followers | Friends - with staggered fade animations */}
      {/* relative z-10 ensures stats row is above hero overlay */}
      <div className="mt-3 px-5 relative z-10 pointer-events-auto">
        <motion.div 
          className="flex items-center justify-between"
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
            className="pb-3 flex items-center gap-2 min-h-[44px] rounded-lg active:scale-[0.97] transition-transform"
            variants={{
              hidden: { opacity: 0, y: 4 },
              show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }
            }}
          >
            <span className="text-sm text-muted-foreground">Posts</span>
            <AnimatedNumber 
              value={postsCount} 
              isLoading={postsCountLoading}
              minCh={2}
              className="text-base font-semibold text-foreground"
            />
          </motion.button>
          
          {/* Followers */}
          <motion.button
            onClick={() => {
              setActiveMiniNav('followers');
              navigate(`/profile/${username}/followers`);
            }}
            className="pb-3 flex items-center gap-2 min-h-[44px] rounded-lg active:scale-[0.97] transition-transform"
            variants={{
              hidden: { opacity: 0, y: 4 },
              show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }
            }}
          >
            <span className="text-sm text-muted-foreground">Followers</span>
            <AnimatedNumber 
              value={followersCount} 
              isLoading={socialCountsLoading} 
              minCh={2}
              className="text-base font-semibold text-foreground"
            />
          </motion.button>
          
          {/* Friends */}
          {isPersonal && (
            <motion.button
              onClick={() => {
                setActiveMiniNav('friends');
                navigate(`/profile/${username}/friends`);
              }}
              className="pb-3 flex items-center gap-2 min-h-[44px] rounded-lg active:scale-[0.97] transition-transform"
              variants={{
                hidden: { opacity: 0, y: 4 },
                show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }
              }}
            >
              <span className="text-sm text-muted-foreground">Friends</span>
              <AnimatedNumber 
                value={friendsCount} 
                isLoading={socialCountsLoading} 
                minCh={2}
                className="text-base font-semibold text-foreground"
              />
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* White content sheet */}
      {/* relative z-10 ensures white sheet and all content is above hero overlay */}
      <div className="pt-4 pb-32 min-h-[60vh] relative z-10 pointer-events-auto">
        {/* About section - removed "About" heading, just the bio text */}
        {/* mb-5 → mb-4 (16px from about text to clubs divider) */}
        {/* Fix 1: Bio section — contextual handling */}
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
            {profile.bio.split('\n').length > 4 && !bioExpanded && (
              <button 
                onClick={() => setBioExpanded(true)}
                className="text-sm text-muted-foreground mt-1 min-h-[44px] flex items-center active:scale-[0.98]"
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 min-h-[44px] text-sm font-medium text-muted-foreground hover:text-foreground transition-colors active:scale-[0.98]"
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
              onClick={() => navigate('/edit-profile')}
              className="text-sm text-muted-foreground italic min-h-[44px] flex items-center active:opacity-70 transition-opacity"
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 min-h-[44px] text-sm font-medium text-muted-foreground hover:text-foreground transition-colors active:scale-[0.98]"
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
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 min-h-[44px] text-sm font-medium text-muted-foreground hover:text-foreground transition-colors active:scale-[0.98]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {formatUrlForDisplay(website)}
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {/* Divider above Clubs section */}
        <div className="px-5 mb-3">
          <div className="border-t border-border" />
        </div>

        {/* Clubs section - directly on page background without card */}
        <ClubsSectionWrapper 
          profileId={profile?.id}
          viewerId={user?.id}
          isPersonal={isPersonal}
          isSelf={isSelf}
        />

        {/* Achievements Rail - shows earned badges with CTA to quest page */}
        {isPersonal && profile?.id && username && (
          <ProfileAchievementsRail
            userId={profile.id}
            username={username}
            isOwnProfile={isSelf}
            className="mb-4"
          />
        )}

        {/* Segmented control tabs - matches schedule page exactly */}
        {/* Explicit touch-action and z-index to ensure tappability on mobile */}
        <section 
          className="px-4 py-2 relative"
          style={{ 
            touchAction: 'auto',
            pointerEvents: 'auto',
            zIndex: 20
          }}
        >
          <div 
            className="flex items-stretch rounded-xl overflow-hidden bg-muted"
            style={{ 
              touchAction: 'auto',
              pointerEvents: 'auto'
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "relative flex-1 py-2.5 text-[13px] font-semibold transition-all duration-200 whitespace-nowrap min-h-[44px] active:scale-[0.98]",
                    isActive 
                      ? "bg-card text-foreground shadow-sm m-1 rounded-lg" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  style={{ touchAction: 'auto' }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Tab Content - 14px gap from tabs to grid */}
        <div className={cn("pt-3.5", (activeSection === 'activity' || activeSection === 'courses') ? 'px-2.5' : 'px-5')}>
          {getCurrentContent()}
        </div>
      </div>

      {/* Bottom Navigation Spacer */}
      <div className="h-20" />

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

