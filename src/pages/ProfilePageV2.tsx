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
import { getProfileType, getProfileTabs } from '@/hooks/useProfileType';
import { useFollow } from '@/hooks/useFollow';
import { useFriendship } from '@/hooks/useFriendship';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, ChevronRight, MoreHorizontal, Send, UserPlus, Check, ExternalLink, Loader2 } from 'lucide-react';
import { AchievementBadgeCard, type AchievementTier } from '@/components/achievements/AchievementBadgeCard';
import { PageRoot } from '@/components/layout/PageRoot';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <section className="px-5 mb-6">
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

const ProfilePageV2: React.FC = () => {
  const navigate = useNavigate();
  const { username: routeUsername } = useParams<{ username?: string }>();
  const { user, loading: authLoading } = useSupabaseSession();
  
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
  const { data: achievements } = useProfileAchievements(profileUserId);
  
  // Determine if viewing own profile
  const isSelf = user?.id === profileUserId;
  
  // Redirect to creator page if user has creator_only enabled (for non-self views)
  useEffect(() => {
    if (!isSelf && profile && (profile as any).creator_only && profileUserId) {
      navigate(`/creator/${profileUserId}`, { replace: true });
    }
  }, [isSelf, profile, profileUserId, navigate]);
  
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

  const postsCount = posts.length;
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
      <PageRoot className="min-h-screen" style={{ background: BG_COLOR }}>
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
          />
        );
      default:
        return null;
    }
  };

  return (
    <PageRoot className="min-h-screen" style={{ background: BG_COLOR }}>
      {/* Hero Section - tall, full bleed */}
      <div className="relative">
        {/* Hero Image */}
        <div className="relative h-[250px] w-full overflow-hidden">
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

        {/* Avatar - squircle, left-aligned with About title (px-5), 50% over hero / 50% below */}
        <div className="absolute left-5 -bottom-[62px] z-20">
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
        </div>

        {/* HCP + Golfer pills - right side, just below header photo */}
        <div className="absolute right-5 top-full mt-3 z-20 flex items-center gap-2">
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
      <div className="pt-[70px] px-5 text-left">
        {/* Name - smaller, more bold */}
        <h1 className="text-[28px] font-semibold text-[#0F0F0F]">
          {displayName}
        </h1>
        
        {/* Home club */}
        {profile?.home_club && (
          <p className="mt-1 text-base font-medium text-[#0F0F0F]">
            {profile.home_club}
          </p>
        )}
      </div>

      {/* Action Buttons - different for self vs other */}
      <div className="mt-5 px-5 flex items-center gap-2">
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
      <div className="mt-6 px-5">
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
              isLoading={statsLoading}
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
      <div className="bg-white pt-5 pb-32 min-h-[60vh]">
        {/* About section - 20px section gap */}
        <section className="px-5 mb-5">
          <h3 className="text-xl font-semibold text-[#0F0F0F] mb-2.5">About</h3>
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

        {/* Clubs section - uses new ClubsCard with useProfileClubs hook - 20px gap */}
        <div className="mb-5">
          <ClubsSectionWrapper 
            profileId={profile?.id}
            viewerId={user?.id}
            isPersonal={isPersonal}
            isSelf={isSelf}
          />
        </div>

        {/* Phase 6: Golf Journey Progress - 20px gap */}
        {isPersonal && profile?.id && (
          <section className="px-5 mb-5">
            <GolfJourneyProgress 
              userId={profile.id}
              isOwnProfile={isSelf}
            />
          </section>
        )}


        {/* Achievements - 16px gap to tabs */}
        {isPersonal && unlockedAchievements.length > 0 && (
          <section className="px-5 mb-4">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xl font-semibold text-[#0F0F0F]">Achievements</h3>
              <button 
                onClick={() => navigate('/profile/quest')}
                className="text-sm font-medium flex items-center gap-0.5 text-slate-500 hover:text-slate-700 transition-colors leading-none"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {unlockedAchievements.slice(0, 3).map((achievement) => {
                const tier: AchievementTier | null =
                  achievement.type === 'milestone' && achievement.threshold
                    ? (String(achievement.threshold) as AchievementTier)
                    : achievement.id === 'list_gb_ireland'
                      ? 'GBI'
                      : achievement.id === 'list_europe'
                        ? 'EU'
                        : achievement.id === 'list_usa'
                          ? 'USA'
                          : achievement.id === 'list_worldwide'
                            ? 'WORLD'
                            : null;

                if (!tier) return null;

                return (
                  <div key={achievement.id} className="flex-shrink-0">
                    <AchievementBadgeCard
                      tier={tier}
                      title={achievement.shortLabel}
                      subtitle={achievement.label}
                      unlocked
                      totalTop100Played={top100Count}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tabs row - fixed height 44px with consistent alignment */}
        <section className="px-4 pt-2 pb-2">
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-transparent border-0 px-0 py-0 h-[44px] gap-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="relative text-sm px-3 py-0 h-full font-medium bg-transparent border-0 shadow-none rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out data-[state=active]:after:w-full data-[state=inactive]:after:w-0 data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-[0.85]"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </section>

        {/* Tab Content - 14px gap from tabs to grid */}
        <div className={cn("pt-3.5", (activeSection === 'activity' || activeSection === 'courses') ? 'px-2.5' : 'px-5')}>
          {getCurrentContent()}
        </div>
      </div>

      {/* Bottom Navigation Spacer */}
      <div className="h-20" />
    </PageRoot>
  );
};

export default ProfilePageV2;
