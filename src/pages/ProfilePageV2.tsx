/**
 * ProfilePageV2 - LinkedIn-style Light Profile
 * Exact match to design mock
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { cn } from '@/lib/utils';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile.tsx';
import { useTop100Overview } from '@/hooks/useTop100Overview';
import { useActivityPostsV2 } from '@/components/profile/activity/v2';
import { usePersonalPostsCount } from '@/hooks/usePersonalPostsCount';
import { getProfileType, getProfileTabs } from '@/hooks/useProfileType';
import { useFollow } from '@/hooks/useFollow';
import { useFriendship } from '@/hooks/useFriendship';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, ChevronRight, MoreHorizontal, Send, UserPlus, Check, ExternalLink, Loader2, ArrowLeft } from 'lucide-react';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';

import { useProfileAchievements } from '@/hooks/useProfileAchievements';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

// Background color - matches course details page (slate-50)
const BG_COLOR = '#f8fafc'; // slate-50

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
  
  const [activeSection, setActiveSection] = useState('activity');
  const [activeMiniNav, setActiveMiniNav] = useState('posts');
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [friendsCount, setFriendsCount] = useState<number | null>(null);
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  const profileTypeInfo = getProfileType(profile?.user_type);
  const { isPersonal } = profileTypeInfo;
  const tabs = getProfileTabs(profile?.user_type);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) {
        setStatsLoading(false);
        return;
      }
      
      setStatsLoading(true);
      try {
        const { count: followers } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profile.id);
        setFollowersCount(followers || 0);

        const { count: following } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profile.id);
        setFollowingCount(following || 0);

        if (isPersonal) {
          const { count: friends } = await supabase
            .from('user_friends')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'accepted')
            .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`);
          setFriendsCount(friends || 0);
        } else {
          setFriendsCount(0);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchStats();
  }, [profile?.id, isPersonal]);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG_COLOR }}>
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Show "Profile unavailable" for deleted or not found profiles
  if (isProfileDeleted || profileNotFound) {
    return (
      <PageRoot className="min-h-screen" style={{ background: BG_COLOR }} immersiveStatusBar>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl text-slate-400">?</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            Profile unavailable
          </h1>
          <p className="text-slate-500 mb-6 max-w-sm">
            This profile doesn't exist or is no longer available.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-slate-800 text-white rounded-full text-sm font-medium hover:bg-slate-700 transition-colors"
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
    <PageRoot className="min-h-screen" style={{ background: BG_COLOR }} immersiveStatusBar>
      {/* Hero Section - full-bleed immersive, extends behind notch */}
      {/* pointer-events: none on container allows clicks to pass through to content below */}
      {/* Children with pointer-events: auto remain interactive */}
      <div className="relative pointer-events-none" style={{ marginTop: 'calc(-1 * max(env(safe-area-inset-top, 0px), 47px))', zIndex: 1 }}>
        {/* Hero Image Container - full-bleed behind notch */}
        <div className="relative w-full overflow-hidden" style={{ height: 'calc(200px + max(env(safe-area-inset-top, 0px), 47px))' }}>
          {heroUrl ? (
            <img 
              src={heroUrl} 
              alt="Profile cover" 
              className="w-full h-full object-cover object-bottom"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400" />
          )}
        </div>

        {/* Glass back button - positioned below safe area */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-md bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors z-10 pointer-events-auto"
          style={{ top: 'calc(1rem + max(env(safe-area-inset-top, 0px), 47px))' }}
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
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
            {/* 2px bluey-grey ring (matches background) */}
            <div
              className="clbhouz-squircle absolute inset-0"
              style={{ background: BG_COLOR }}
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
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-600">
                  {displayName.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </button>

        {/* HCP + Golfer pills - right side, just below header photo */}
        {/* Reduced gap: mt-3 → mt-2 (8px from golfer badge to next element) */}
        <div className="absolute right-5 z-20 flex items-center gap-2 pointer-events-auto" style={{ top: 'calc(200px + max(env(safe-area-inset-top, 0px), 47px) + 8px)' }}>
          {/* HCP pill - white, bigger size */}
          {profile?.eg_handicap_index != null && (
            <span 
              className="px-4 py-1.5 text-sm font-semibold rounded-full text-[#0F0F0F] flex items-center justify-center"
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
        <h1 className="text-[28px] font-semibold text-[#0F0F0F]">
          {displayName}
        </h1>
      </div>

      {/* Action Buttons - different for self vs other */}
      {/* relative z-10 ensures buttons are above hero overlay */}
      <div className="mt-3 px-5 flex items-center gap-2 relative z-10 pointer-events-auto">
        {isSelf ? (
          <>
            {/* Self: Disabled Follow button */}
            <button 
              className="h-9 flex-1 rounded-full text-sm font-semibold text-white/60 flex items-center justify-center cursor-not-allowed"
              style={{ background: '#94a3b8' }}
              disabled
            >
              Follow
            </button>
            
            {/* Self: Disabled Friend Request button */}
            <button 
              className="h-9 flex-1 rounded-full text-sm font-semibold text-slate-400 flex items-center justify-center gap-1.5 cursor-not-allowed"
              style={{
                background: '#f1f5f9',
                border: '1px solid #E0E0E0'
              }}
              disabled
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Friend
            </button>
            
            {/* Self: Three dots with Edit Profile */}
            <DropdownMenu onOpenChange={(open) => {
              if (!open) {
                // Blur the trigger button when menu closes to remove focus ring
                (document.activeElement as HTMLElement)?.blur();
              }
            }}>
              <DropdownMenuTrigger asChild>
                <button 
                  className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center focus:outline-none focus-visible:outline-none active:outline-none"
                  style={{
                    background: '#fff',
                    border: '1px solid #E0E0E0'
                  }}
                >
                  <MoreHorizontal className="w-4 h-4 text-[#0F0F0F]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/edit-profile')}>
                  Edit Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            {/* Other: Active Follow button */}
            <button 
              className="h-9 flex-1 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60"
              style={{ background: isFollowing === 'following' ? '#334155' : '#64748b' }}
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
            
            {/* Other: Friend Request button (replaces Message) */}
            <button 
              className="h-9 flex-1 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
              style={{
                background: friendshipStatus === 'friends' ? '#dcfce7' : '#fff',
                border: '1px solid #E0E0E0',
                color: friendshipStatus === 'friends' ? '#166534' : '#0F0F0F'
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
            
            {/* Other: No three dots menu */}
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
            className="pb-3 flex items-center gap-2"
            variants={{
              hidden: { opacity: 0, y: 4 },
              show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }
            }}
          >
            <span className="text-sm text-slate-500">Posts</span>
            <AnimatedNumber 
              value={postsCount} 
              isLoading={postsCountLoading}
              minCh={2}
              className="text-base font-semibold text-[#0F0F0F]"
            />
          </motion.button>
          
          {/* Followers */}
          <motion.button
            onClick={() => {
              setActiveMiniNav('followers');
              navigate(`/profile/${username}/followers`);
            }}
            className="pb-3 flex items-center gap-2"
            variants={{
              hidden: { opacity: 0, y: 4 },
              show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }
            }}
          >
            <span className="text-sm text-slate-500">Followers</span>
            <AnimatedNumber 
              value={followersCount} 
              isLoading={statsLoading} 
              minCh={2}
              className="text-base font-semibold text-[#0F0F0F]"
            />
          </motion.button>
          
          {/* Friends */}
          {isPersonal && (
            <motion.button
              onClick={() => {
                setActiveMiniNav('friends');
                navigate(`/profile/${username}/friends`);
              }}
              className="pb-3 flex items-center gap-2"
              variants={{
                hidden: { opacity: 0, y: 4 },
                show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }
              }}
            >
              <span className="text-sm text-slate-500">Friends</span>
              <AnimatedNumber 
                value={friendsCount} 
                isLoading={statsLoading} 
                minCh={2}
                className="text-base font-semibold text-[#0F0F0F]"
              />
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* White content sheet */}
      {/* relative z-10 ensures white sheet and all content is above hero overlay */}
      <div className="bg-white pt-4 pb-32 min-h-[60vh] relative z-10 pointer-events-auto">
        {/* About section - removed "About" heading, just the bio text */}
        {/* mb-5 → mb-4 (16px from about text to clubs divider) */}
        <section className="px-5 mb-4">
          <p className="text-base text-[#0F0F0F] leading-relaxed whitespace-pre-wrap" style={{ overflowWrap: 'anywhere' }}>
            {profile?.bio || 'Passionate golfer with a love for links courses. Always working to improve my game and explore new courses.'}
          </p>
          
          {/* Websites as pills - directly under bio */}
          {websites.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {websites.map((website, index) => (
                <a
                  key={index}
                  href={ensureProtocol(website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {formatUrlForDisplay(website)}
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Divider above Clubs section */}
        <div className="px-5 mb-3">
          <div className="border-t border-slate-200" />
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
            className="mb-4"
          />
        )}

        {/* Segmented control tabs - matches schedule page exactly */}
        {/* Explicit touch-action and z-index to ensure tappability on mobile */}
        <section 
          className="px-4 py-2 relative"
          data-debug-id="profile-tabs-row"
          style={{ 
            touchAction: 'auto',
            pointerEvents: 'auto',
            zIndex: 20
          }}
          onPointerDown={(e) => {
            logPoint('tabs_row.pointerdown', { x: e.clientX, y: e.clientY });
          }}
          onTouchStart={(e) => {
            const t = e.touches?.[0];
            logPoint('tabs_row.pointerdown', { x: t?.clientX, y: t?.clientY, via: 'touchstart' });
          }}
        >
          <div 
            className="flex items-stretch rounded-xl overflow-hidden"
            style={{ 
              background: '#e2e8f0',
              touchAction: 'auto',
              pointerEvents: 'auto'
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  data-debug-id={`profile-tab-${tab.id}`}
                  onPointerDown={(e) => {
                    logPoint('tabs_row.pointerdown', { tabId: tab.id, x: e.clientX, y: e.clientY });
                  }}
                  onTouchStart={(e) => {
                    const t = e.touches?.[0];
                    logPoint('tabs_row.pointerdown', { tabId: tab.id, x: t?.clientX, y: t?.clientY, via: 'touchstart' });
                  }}
                  onClick={() => {
                    logPoint('tabs_row.click', { tabId: tab.id });
                    setActiveSection(tab.id);
                  }}
                  className={cn(
                    "relative flex-1 py-2.5 text-[13px] font-semibold transition-all duration-200 whitespace-nowrap min-h-[44px]",
                    isActive 
                      ? "bg-white text-slate-800 shadow-sm m-1 rounded-lg" 
                      : "text-slate-500 hover:text-slate-700"
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

