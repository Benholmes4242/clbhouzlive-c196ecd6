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
import { Trophy, ChevronRight, MoreHorizontal, Navigation } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfileAchievements } from '@/hooks/useProfileAchievements';

// Tab content components
import ActivityFeed from '@/components/profile/ActivityFeed';
import { ProfileCoursesTab } from '@/components/profile/ProfileCoursesTab';
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';
import AchievementsPane from '@/components/profile/AchievementsPane';
import HandicapSection from '@/components/profile/HandicapSection';

// Background colors
const BG_WHITE = '#FFFFFF';
const BG_LIGHT = '#F5F7FA';

const ProfilePageV2: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseSession();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: top100Overview } = useTop100Overview(user?.id);
  const { posts } = useActivityPosts(user?.id);
  const { data: achievements } = useProfileAchievements(user?.id);
  
  const [activeSection, setActiveSection] = useState('activity');
  const [activeMiniNav, setActiveMiniNav] = useState('about');
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG_WHITE }}>
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
  const roundsLogged = 235; // Placeholder - would come from actual data

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
    <PageRoot className="min-h-screen" style={{ background: BG_WHITE }}>
      {/* Hero Section */}
      <div className="relative">
        {/* Hero Image */}
        <div className="relative h-[320px] w-full overflow-hidden">
          {heroUrl ? (
            <img 
              src={heroUrl} 
              alt="Profile cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sky-200 via-sky-300 to-slate-300" />
          )}
          {/* Gradient fade to white */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(255,255,255,0.3) 60%, rgba(255,255,255,0.7) 80%, ${BG_WHITE} 100%)`
            }}
          />
        </div>

        {/* Avatar - squircle with WHITE ring */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-16 z-20">
          {/* White border ring */}
          <div 
            className="clbhouz-squircle relative w-[140px] h-[140px] flex items-center justify-center"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }}
          >
            {/* Inner avatar */}
            <div 
              className="clbhouz-squircle w-[128px] h-[128px] overflow-hidden relative"
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
      </div>

      {/* Identity Stack */}
      <div className="pt-20 px-4 text-center">
        {/* Name - bold italic serif style */}
        <h1 
          className="text-[32px] font-bold text-[#1A1A1A] tracking-tight"
          style={{ fontStyle: 'italic' }}
        >
          {displayName}
        </h1>
        
        {/* Golfer · Home Club · HCP pill */}
        <div className="mt-1 flex items-center justify-center gap-2">
          <p className="text-[17px] text-[#4A4A4A]">
            Golfer{profile?.home_club && <> · {profile.home_club}</>}
          </p>
          
          {/* HCP pill - white with border, just number */}
          {profile?.eg_handicap_index != null && (
            <span 
              className="px-2.5 py-0.5 text-[15px] font-semibold rounded-full text-[#1A1A1A]"
              style={{ 
                background: '#FFFFFF',
                border: '1.5px solid #D0D0D0'
              }}
            >
              {formatHandicap(profile.eg_handicap_index)}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 px-5 flex items-center justify-center gap-2">
        {/* Follow - blue filled pill */}
        <button 
          className="h-11 flex-1 max-w-[180px] rounded-full text-[15px] font-semibold text-white flex items-center justify-center"
          style={{ background: '#0066FF' }}
        >
          Follow
        </button>
        
        {/* Message - white with blue border */}
        <button 
          className="h-11 flex-1 max-w-[180px] rounded-full text-[15px] font-semibold flex items-center justify-center gap-2"
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #0066FF',
            color: '#0066FF'
          }}
        >
          <Navigation className="w-4 h-4" style={{ transform: 'rotate(45deg)' }} />
          Message
        </button>
        
        {/* More - circular */}
        <button 
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #D0D0D0'
          }}
        >
          <MoreHorizontal className="w-5 h-5 text-[#4A4A4A]" />
        </button>
      </div>

      {/* Stats row: About | Followers | Friends */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between border-b border-[#E5E5E5]">
          {/* About */}
          <button
            onClick={() => setActiveMiniNav('about')}
            className="relative pb-3"
          >
            <span className="text-[16px] font-medium text-[#1A1A1A]">About</span>
            {activeMiniNav === 'about' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A1A1A]" />
            )}
          </button>
          
          {/* Followers */}
          <button
            onClick={() => {
              setActiveMiniNav('followers');
              navigate(`/profile/${username}/followers`);
            }}
            className="relative pb-3 flex items-center gap-2"
          >
            <span className="text-[16px] font-semibold text-[#1A1A1A]">{followersCount}</span>
            <span className="text-[16px] font-normal text-[#4A4A4A]">Followers</span>
            {activeMiniNav === 'followers' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A1A1A]" />
            )}
          </button>
          
          {/* Friends */}
          {isPersonal && (
            <button
              onClick={() => {
                setActiveMiniNav('friends');
                navigate(`/profile/${username}/friends`);
              }}
              className="relative pb-3 flex items-center gap-2"
            >
              <span className="text-[16px] font-semibold text-[#1A1A1A]">{friendsCount}</span>
              <span className="text-[16px] font-normal text-[#4A4A4A]">Friends</span>
              {activeMiniNav === 'friends' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A1A1A]" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* White content area */}
      <div className="bg-white pt-5 pb-32 min-h-[60vh]">
        {/* About section */}
        <section className="px-5 mb-6">
          <h3 className="text-[22px] font-bold text-[#1A1A1A] mb-2">About</h3>
          <p className="text-[16px] text-[#1A1A1A] leading-relaxed">
            {profile?.bio || 'Passionate golfer with a love for links courses. Always working to improve my game and explore new courses.'}
          </p>
          <div className="flex justify-end mt-2">
            <button className="text-[16px] font-medium" style={{ color: '#0066FF' }}>
              See more
            </button>
          </div>
        </section>

        {/* Golf Snapshot */}
        <section className="px-5 mb-6">
          <h3 className="text-[22px] font-bold text-[#1A1A1A] mb-3">Golf Snapshot</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Left card */}
            <div 
              className="rounded-xl overflow-hidden bg-white"
              style={{ border: '1px solid #E5E5E5' }}
            >
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E5E5E5]">
                <span className="text-[15px] text-[#1A1A1A]">Handicap</span>
                <span className="text-[15px] font-semibold text-[#1A1A1A]">{formatHandicap(profile?.eg_handicap_index)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-[15px] text-[#1A1A1A]">Home Club</span>
                <span className="text-[15px] font-semibold text-[#1A1A1A] truncate max-w-[100px]">
                  {profile?.home_club ? profile.home_club.split(' ')[0] : '–'}
                </span>
              </div>
            </div>

            {/* Right card */}
            <div 
              className="rounded-xl overflow-hidden bg-white"
              style={{ border: '1px solid #E5E5E5' }}
            >
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E5E5E5]">
                <span className="text-[15px] text-[#1A1A1A]">Home Club</span>
                <span className="text-[15px] font-semibold text-[#1A1A1A] truncate max-w-[100px]">
                  {profile?.home_club ? profile.home_club.split(' ')[0] : '–'}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-[15px] text-[#1A1A1A]">Rounds Logged</span>
                <span className="text-[15px] font-semibold text-[#1A1A1A]">{roundsLogged}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Achievements */}
        {isPersonal && unlockedAchievements.length > 0 && (
          <section className="px-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[22px] font-bold text-[#1A1A1A]">Achievements</h3>
              <button 
                onClick={() => navigate('/profile/quest')}
                className="text-[15px] font-medium flex items-center gap-1"
                style={{ color: '#0066FF' }}
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {unlockedAchievements.slice(0, 3).map((achievement) => (
                <div 
                  key={achievement.id}
                  className="flex-shrink-0 w-[140px] p-3 rounded-xl bg-white"
                  style={{
                    border: '1px solid #E5E5E5'
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                    style={{ background: 'rgba(0,102,255,0.1)' }}
                  >
                    <Trophy className="w-4 h-4" style={{ color: '#0066FF' }} />
                  </div>
                  <div className="text-[14px] font-semibold text-[#1A1A1A]">{achievement.label}</div>
                  <div className="text-[12px] text-[#4A4A4A]">{achievement.shortLabel}</div>
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
                background: '#F0F2F5',
                border: '1px solid #E5E5E5'
              }}
            >
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id}
                  className="rounded-full text-[14px] px-3 py-1.5 font-medium transition-all duration-150 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  style={{
                    color: '#1A1A1A'
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
