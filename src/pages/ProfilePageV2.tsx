/**
 * ProfilePageV2 - LinkedIn-style Light Profile
 * Exact match to design mock
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile.tsx';
import { useTop100Overview } from '@/hooks/useTop100Overview';
import { useActivityPosts } from '@/components/profile/hooks/useActivityPosts';
import { getProfileType, getProfileTabs } from '@/hooks/useProfileType';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, ChevronRight, MoreHorizontal, Send } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfileAchievements } from '@/hooks/useProfileAchievements';

// Tab content components
import ActivityFeed from '@/components/profile/ActivityFeed';
import { ProfileCoursesTab } from '@/components/profile/ProfileCoursesTab';
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';
import AchievementsPane from '@/components/profile/AchievementsPane';
import HandicapSection from '@/components/profile/HandicapSection';

// Background color - bluey grey
const BG_COLOR = '#E8EBF0';

const ProfilePageV2: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseSession();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: top100Overview } = useTop100Overview(user?.id);
  const { posts } = useActivityPosts(user?.id);
  const { data: achievements } = useProfileAchievements(user?.id);
  
  const [activeSection, setActiveSection] = useState('activity');
  const [activeMiniNav, setActiveMiniNav] = useState('posts');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);

  const profileTypeInfo = getProfileType(profile?.user_type);
  const { isPersonal } = profileTypeInfo;
  const tabs = getProfileTabs(profile?.user_type);

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

  if (authLoading || profileLoading) {
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

  const displayName = profile?.display_name || 'Golfer';
  const username = profile?.username || 'user';
  const heroUrl = profile?.header_photo_url || profile?.profile_photo_url || '';
  const top100Count = top100Overview?.total_played ?? 0;
  const roundsLogged = 325; // Placeholder - would come from actual data

  const getCurrentContent = () => {
    switch (activeSection) {
      case 'activity':
        return (
          <ActivityFeed
            userId={profile?.id || ''}
            isOwnProfile={true}
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
            isOwnProfile={true}
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
            isCurrentUser={true}
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
        <div className="relative h-[280px] w-full overflow-hidden">
          {heroUrl ? (
            <img 
              src={heroUrl} 
              alt="Profile cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400" />
          )}
          {/* More gradual fade at bottom */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, transparent 50%, ${BG_COLOR}40 70%, ${BG_COLOR}90 85%, ${BG_COLOR} 100%)`
            }}
          />
        </div>

        {/* Avatar with achievement ring - using global squircle design */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-12 z-20">
          {/* Achievement ring container */}
          <div 
            className="relative"
            style={{
              width: '124px',
              height: '124px',
              boxShadow: '0 12px 30px rgba(15,15,15,0.22)'
            }}
          >
            {/* Ring background - squircle shape */}
            <div 
              className="clbhouz-squircle absolute inset-0"
              style={{ background: '#8B7355' }}
            />
            {/* Inner avatar - squircle shape, positioned with ring gap */}
            <div 
              className="clbhouz-squircle absolute"
              style={{
                top: '2.5px',
                left: '2.5px',
                right: '2.5px',
                bottom: '2.5px',
                overflow: 'hidden'
              }}
            >
              {profile?.profile_photo_url ? (
                <img 
                  src={profile.profile_photo_url} 
                  alt={displayName}
                  className="w-full h-full object-cover"
                  style={{ position: 'absolute', inset: 0 }}
                />
              ) : (
                <div 
                  className="w-full h-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-600"
                  style={{ position: 'absolute', inset: 0 }}
                >
                  {displayName.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Identity Stack - reduced spacing */}
      <div className="pt-14 px-4 text-center">
        {/* Name - smaller, more bold */}
        <h1 className="text-[28px] font-semibold text-[#0F0F0F]">
          {displayName}
        </h1>
        
        {/* Home club + HCP pill inline */}
        <div className="mt-1 flex items-center justify-center gap-2">
          {profile?.home_club && (
            <p className="text-base font-medium text-[#0F0F0F]">
              {profile.home_club}
            </p>
          )}
          
          {/* HCP - no background, just text */}
          {profile?.eg_handicap_index != null && (
            <span className="text-sm font-medium text-[#6B7280]">
              HCP {formatHandicap(profile.eg_handicap_index)}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons - longer buttons */}
      <div className="mt-5 px-4 flex items-center justify-center gap-2">
        {/* Follow - blue filled pill, longer */}
        <button 
          className="h-8 px-8 rounded-full text-xs font-semibold text-white flex items-center justify-center"
          style={{ background: '#0066FF' }}
        >
          Follow
        </button>
        
        {/* Message - white outline pill, longer */}
        <button 
          className="h-8 px-6 rounded-full text-xs font-semibold text-[#0F0F0F] flex items-center justify-center gap-1.5"
          style={{
            background: '#fff',
            border: '1px solid #E0E0E0'
          }}
        >
          <Send className="w-3 h-3" />
          Message
        </button>
        
        {/* More - circular */}
        <button 
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: '#fff',
            border: '1px solid #E0E0E0'
          }}
        >
          <MoreHorizontal className="w-4 h-4 text-[#0F0F0F]" />
        </button>
      </div>

      {/* Mini-nav row: Posts | Followers | Friends - increased gap between title and number */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between border-b border-[#D0D4DB]">
          {/* Posts */}
          <button
            onClick={() => setActiveMiniNav('posts')}
            className="relative pb-3 px-2"
          >
            <span className={`text-base font-medium text-[#0F0F0F]`}>
              Posts<span className="ml-2 font-semibold">{postsCount}</span>
            </span>
            {activeMiniNav === 'posts' && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0F0F0F] rounded-full" />
            )}
          </button>
          
          {/* Followers */}
          <button
            onClick={() => {
              setActiveMiniNav('followers');
              navigate(`/profile/${username}/followers`);
            }}
            className="relative pb-3 px-2"
          >
            <span className={`text-base font-medium text-[#0F0F0F]`}>
              Followers<span className="ml-2 font-semibold">{followersCount}</span>
            </span>
            {activeMiniNav === 'followers' && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0F0F0F] rounded-full" />
            )}
          </button>
          
          {/* Friends */}
          {isPersonal && (
            <button
              onClick={() => {
                setActiveMiniNav('friends');
                navigate(`/profile/${username}/friends`);
              }}
              className="relative pb-3 px-2"
            >
              <span className={`text-base font-medium text-[#0F0F0F]`}>
                Friends<span className="ml-2 font-semibold">{friendsCount}</span>
              </span>
              {activeMiniNav === 'friends' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0F0F0F] rounded-full" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* White content sheet */}
      <div className="bg-white pt-5 pb-32 min-h-[60vh]">
        {/* About section */}
        <section className="px-5 mb-6">
          <h3 className="text-xl font-bold text-[#0F0F0F] mb-2">About</h3>
          <p className="text-base text-[#0F0F0F] leading-relaxed font-medium">
            {profile?.bio || 'Passionate golfer with a love for links courses. Always working to improve my game and explore new courses.'}
          </p>
          <div className="flex justify-end mt-2">
            <button className="text-base font-medium" style={{ color: '#0066FF' }}>
              See more
            </button>
          </div>
        </section>

        {/* Golf Snapshot */}
        <section className="px-5 mb-6">
          <h3 className="text-xl font-bold text-[#0F0F0F] mb-3">Golf Snapshot</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Left card */}
            <div 
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid #E0E0E0' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E8E8]">
                <span className="text-sm text-[#0F0F0F]">Handicap</span>
                <span className="text-sm font-semibold text-[#0F0F0F]">{formatHandicap(profile?.eg_handicap_index)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#0F0F0F]">Home Club</span>
                <span className="text-sm font-semibold text-[#0F0F0F] truncate max-w-[100px]">
                  {profile?.home_club ? profile.home_club.split(' ')[0] : '–'}
                </span>
              </div>
            </div>

            {/* Right card */}
            <div 
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid #E0E0E0' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E8E8]">
                <span className="text-sm text-[#0F0F0F]">Home Club</span>
                <span className="text-sm font-semibold text-[#0F0F0F] truncate max-w-[100px]">
                  {profile?.home_club ? profile.home_club.split(' ')[0] : '–'}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#0F0F0F]">Rounds Logged</span>
                <span className="text-sm font-semibold text-[#0F0F0F]">{roundsLogged}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Achievements */}
        {isPersonal && unlockedAchievements.length > 0 && (
          <section className="px-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-[#0F0F0F]">Achievements</h3>
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
