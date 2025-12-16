/**
 * ProfilePageV2 - LinkedIn-style Light Profile
 * Supports viewing own profile and other users' profiles
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile.tsx';
import { useTop100Overview } from '@/hooks/useTop100Overview';
import { useActivityPosts } from '@/components/profile/hooks/useActivityPosts';
import { getProfileType, getProfileTabs } from '@/hooks/useProfileType';
import { useRelationshipStatus } from '@/hooks/useRelationshipStatus';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, ChevronRight, MoreHorizontal, Send, UserPlus, Check, Clock } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfileAchievements } from '@/hooks/useProfileAchievements';
import { ProfileHeaderMedia } from '@/components/profile/shared/ProfileHeaderMedia';
import { WebsitePills } from '@/components/profile/shared/WebsitePills';
import { toast } from 'sonner';
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

// Background color - matches course details page (slate-50)
const BG_COLOR = '#f8fafc'; // slate-50

const ProfilePageV2: React.FC = () => {
  const navigate = useNavigate();
  const { username: routeUsername } = useParams<{ username?: string }>();
  const { user, loading: authLoading } = useSupabaseSession();
  
  // Determine which profile to show
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [loadingProfileId, setLoadingProfileId] = useState(false);
  
  // Fetch profile ID from username if viewing another user
  useEffect(() => {
    const fetchProfileId = async () => {
      if (routeUsername) {
        setLoadingProfileId(true);
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('username', routeUsername)
          .single();
        
        if (data && !error) {
          setProfileUserId(data.id);
        } else {
          setProfileUserId(null);
        }
        setLoadingProfileId(false);
      } else if (user?.id) {
        setProfileUserId(user.id);
      }
    };
    
    fetchProfileId();
  }, [routeUsername, user?.id]);
  
  const { data: profile, isLoading: profileLoading } = useUserProfile(profileUserId);
  const { data: top100Overview } = useTop100Overview(profileUserId);
  const { posts } = useActivityPosts(profileUserId);
  const { data: achievements } = useProfileAchievements(profileUserId);
  const { data: relationshipStatus } = useRelationshipStatus(profileUserId);
  
  // Determine if viewing own profile
  const isSelf = user?.id === profileUserId;
  
  const [activeSection, setActiveSection] = useState('activity');
  const [activeMiniNav, setActiveMiniNav] = useState('posts');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);
  const [friendStatus, setFriendStatus] = useState<'none' | 'friends' | 'requested' | 'incoming'>('none');

  const profileTypeInfo = getProfileType(profile?.user_type);
  const { isPersonal } = profileTypeInfo;
  const tabs = getProfileTabs(profile?.user_type);

  // Update relationship states from hook
  useEffect(() => {
    if (relationshipStatus) {
      setIsFollowing(relationshipStatus.isFollowing);
      if (relationshipStatus.isFriend) {
        setFriendStatus('friends');
      } else if (relationshipStatus.hasPendingFriendRequestToThem) {
        setFriendStatus('requested');
      } else if (relationshipStatus.hasPendingFriendRequestFromThem) {
        setFriendStatus('incoming');
      } else {
        setFriendStatus('none');
      }
    }
  }, [relationshipStatus]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return;
      
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
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
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

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!user?.id || !profileUserId || isSelf) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileUserId);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        // Follow
        await supabase
          .from('user_follows')
          .insert({ follower_id: user.id, following_id: profileUserId });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  // Handle friend request
  const handleFriendRequest = async () => {
    if (!user?.id || !profileUserId || isSelf) return;
    
    setFriendRequestLoading(true);
    try {
      if (friendStatus === 'none') {
        // Send friend request
        await supabase
          .from('user_friends')
          .insert({ 
            user_id: user.id, 
            friend_id: profileUserId,
            status: 'pending'
          });
        setFriendStatus('requested');
        toast.success('Friend request sent');
      } else if (friendStatus === 'incoming') {
        // Accept incoming request
        await supabase
          .from('user_friends')
          .update({ status: 'accepted' })
          .eq('user_id', profileUserId)
          .eq('friend_id', user.id);
        setFriendStatus('friends');
        setFriendsCount(prev => prev + 1);
        toast.success('Friend request accepted');
      }
    } catch (error) {
      console.error('Error with friend request:', error);
      toast.error('Failed to send friend request');
    } finally {
      setFriendRequestLoading(false);
    }
  };

  // Get friend button label and icon
  const getFriendButtonContent = () => {
    switch (friendStatus) {
      case 'friends':
        return { label: 'Friends', icon: Check, disabled: true };
      case 'requested':
        return { label: 'Requested', icon: Clock, disabled: true };
      case 'incoming':
        return { label: 'Accept', icon: UserPlus, disabled: false };
      default:
        return { label: 'Add Friend', icon: UserPlus, disabled: false };
    }
  };

  const friendButtonContent = getFriendButtonContent();

  if (authLoading || profileLoading || loadingProfileId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG_COLOR }}>
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG_COLOR }}>
        <p className="text-slate-500">Profile not found</p>
      </div>
    );
  }

  const displayName = profile?.display_name || 'Golfer';
  const username = profile?.username || 'user';
  const heroUrl = profile?.header_photo_url || profile?.profile_photo_url || '';

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
        {/* Hero Image - uses shared component for consistent crop */}
        <ProfileHeaderMedia headerUrl={heroUrl} />

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

      {/* Action Buttons - full width from avatar left edge to Golfer pill right edge */}
      <div className="mt-5 px-5 flex items-center gap-2">
        {isSelf ? (
          <>
            {/* Own profile: disabled Follow + disabled Friend Request + dots with Edit Profile */}
            <button 
              disabled
              className="h-9 flex-1 rounded-full text-sm font-semibold text-white/60 flex items-center justify-center cursor-not-allowed"
              style={{ background: '#94a3b8' }}
            >
              Follow
            </button>
            
            <button 
              disabled
              className="h-9 flex-1 rounded-full text-sm font-semibold text-slate-400 flex items-center justify-center gap-1.5 cursor-not-allowed"
              style={{
                background: '#f8fafc',
                border: '1px solid #E0E0E0'
              }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Friend
            </button>
            
            {/* Three dots menu - only for self */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center"
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
            {/* Other user's profile: active Follow + Friend Request, no dots */}
            <button 
              onClick={handleFollowToggle}
              disabled={followLoading}
              className="h-9 flex-1 rounded-full text-sm font-semibold text-white flex items-center justify-center"
              style={{ background: isFollowing ? '#334155' : '#64748b' }}
            >
              {followLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isFollowing ? 'Following' : 'Follow'
              )}
            </button>
            
            <button 
              onClick={handleFriendRequest}
              disabled={friendRequestLoading || friendButtonContent.disabled}
              className="h-9 flex-1 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5"
              style={{
                background: friendStatus === 'friends' ? '#f0fdf4' : '#fff',
                border: `1px solid ${friendStatus === 'friends' ? '#86efac' : '#E0E0E0'}`,
                color: friendStatus === 'friends' ? '#166534' : '#0F0F0F',
                cursor: friendButtonContent.disabled ? 'default' : 'pointer',
                opacity: friendButtonContent.disabled && friendStatus !== 'friends' ? 0.6 : 1
              }}
            >
              {friendRequestLoading ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <>
                  <friendButtonContent.icon className="w-3.5 h-3.5" />
                  {friendButtonContent.label}
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Mini-nav row: Posts | Followers | Friends - evenly distributed across full width */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between">
          {/* Posts */}
          <button
            onClick={() => setActiveMiniNav('posts')}
            className="pb-3 flex items-center gap-2"
          >
            <span className="text-sm text-slate-500">Posts</span>
            <span className="text-base font-semibold text-[#0F0F0F]">{postsCount}</span>
          </button>
          
          {/* Followers */}
          <button
            onClick={() => {
              setActiveMiniNav('followers');
              navigate(`/profile/${username}/followers`);
            }}
            className="pb-3 flex items-center gap-2"
          >
            <span className="text-sm text-slate-500">Followers</span>
            <span className="text-base font-semibold text-[#0F0F0F]">{followersCount}</span>
          </button>
          
          {/* Friends */}
          {isPersonal && (
            <button
              onClick={() => {
                setActiveMiniNav('friends');
                navigate(`/profile/${username}/friends`);
              }}
              className="pb-3 flex items-center gap-2"
            >
              <span className="text-sm text-slate-500">Friends</span>
              <span className="text-base font-semibold text-[#0F0F0F]">{friendsCount}</span>
            </button>
          )}
        </div>
      </div>

      {/* White content sheet */}
      <div className="bg-white pt-5 pb-32 min-h-[60vh]">
        {/* About section */}
        <section className="px-5 mb-6">
          <h3 className="text-xl font-semibold text-[#0F0F0F] mb-2">About</h3>
          <p className="text-base text-[#0F0F0F] leading-relaxed">
            {profile?.bio || 'Passionate golfer with a love for links courses. Always working to improve my game and explore new courses.'}
          </p>
          {/* Website pills directly under bio */}
          {profile?.websites && profile.websites.length > 0 && (
            <WebsitePills websites={profile.websites} />
          )}
        </section>


        {/* Achievements */}
        {isPersonal && unlockedAchievements.length > 0 && (
          <section className="px-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-[#0F0F0F]">Achievements</h3>
              <button 
                onClick={() => navigate('/profile/quest')}
                className="text-base font-medium flex items-center gap-1"
                style={{ color: '#0066FF' }}
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {unlockedAchievements.slice(0, 3).map((achievement) => (
                <div 
                  key={achievement.id}
                  className="flex-shrink-0 w-[140px] p-3 rounded-xl"
                  style={{
                    background: '#F8F8F8',
                    border: '1px solid #E0E0E0'
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                    style={{ background: 'rgba(139,115,85,0.15)' }}
                  >
                    <Trophy className="w-4 h-4" style={{ color: '#8B7355' }} />
                  </div>
                  <div className="text-sm font-semibold text-[#0F0F0F]">{achievement.label}</div>
                  <div className="text-xs text-[#0F0F0F]">{achievement.shortLabel}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tabs */}
        <section className="px-5">
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList 
              className="grid w-full rounded-full px-1 py-1"
              style={{ 
                gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
                background: '#F0F0F0',
                border: '1px solid #E0E0E0'
              }}
            >
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id}
                  className="rounded-full text-sm px-3 py-1.5 font-medium transition-all duration-150 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  style={{
                    color: '#0F0F0F'
                  }}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </section>

        {/* Tab Content */}
        <div className="pt-4 px-5">
          {getCurrentContent()}
        </div>
      </div>

      {/* Bottom Navigation Spacer */}
      <div className="h-20" />
    </PageRoot>
  );
};

export default ProfilePageV2;
