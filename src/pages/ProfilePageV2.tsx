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

// Background color - correct #F4F5F7
const BG_COLOR = '#F4F5F7';

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
      {/* Hero Section - 280px, fades into #F4F5F7 */}
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
          {/* Gradient overlay - starts at 60%, ends at 100% */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(244,245,247,0) 60%, rgba(244,245,247,1) 100%)'
            }}
          />
        </div>

        {/* Avatar - squircle with tan ring #8B7355 */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-14 z-20">
          {/* Achievement ring - squircle w-[120px] h-[120px] */}
          <div 
            className="clbhouz-squircle relative w-[120px] h-[120px] flex items-center justify-center"
            style={{
              background: '#8B7355',
              boxShadow: '0 12px 30px rgba(15,15,15,0.18)'
            }}
          >
            {/* Inner avatar - squircle, 4px ring means inner is 112px */}
            <div 
              className="clbhouz-squircle w-[112px] h-[112px] overflow-hidden"
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
      <div className="pt-16 px-4 text-center">
        {/* Name - 32px font-extrabold */}
        <h1 
          className="text-[32px] font-extrabold tracking-[-0.02em]"
          style={{ color: '#0F0F0F' }}
        >
          {displayName}
        </h1>
        
        {/* Subtitle: Golfer · Club */}
        <div className="mt-1 flex items-center justify-center gap-2">
          <p 
            className="text-[16px]"
            style={{ color: 'rgba(15,15,15,0.65)' }}
          >
            Golfer · {profile?.home_club || 'Golf Club'}
          </p>
          
          {/* HCP pill - grey with border */}
          {profile?.eg_handicap_index != null && (
            <span 
              className="px-3 py-1.5 text-[14px] font-bold rounded-full"
              style={{ 
                background: 'rgba(15,15,15,0.06)',
                border: '1px solid rgba(15,15,15,0.10)',
                color: 'rgba(15,15,15,0.8)'
              }}
            >
              HCP {formatHandicap(profile.eg_handicap_index)}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons - 44px tall */}
      <div className="mt-5 px-4 flex items-center justify-center gap-2">
        {/* Follow - blue filled pill, h-[44px] min-w-[150px] */}
        <button 
          className="h-[44px] min-w-[150px] px-10 rounded-full text-sm font-semibold text-white flex items-center justify-center"
          style={{ background: '#0066FF' }}
        >
          Follow
        </button>
        
        {/* Message - white with blue outline, h-[44px] */}
        <button 
          className="h-[44px] px-8 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
          style={{
            background: '#FFFFFF',
            border: '2px solid #0066FF',
            color: '#0066FF'
          }}
        >
          <Send className="w-4 h-4" />
          Message
        </button>
        
        {/* More - circular 44px */}
        <button 
          className="w-[44px] h-[44px] rounded-full flex items-center justify-center"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(15,15,15,0.08)'
          }}
        >
          <MoreHorizontal className="w-5 h-5" style={{ color: '#0F0F0F' }} />
        </button>
      </div>

      {/* Mini-nav row: About 57 Followers 9 Friends - on #F4F5F7, no card */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-center">
          {/* About */}
          <button
            onClick={() => setActiveMiniNav('about')}
            className="relative px-3 pb-3"
          >
            <span 
              className="text-[15px] font-semibold"
              style={{ color: '#0F0F0F' }}
            >
              About
            </span>
            {activeMiniNav === 'about' && (
              <div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-[52px] rounded-full"
                style={{ background: '#0F0F0F' }}
              />
            )}
          </button>
          
          {/* Posts count */}
          <span 
            className="text-[15px] font-semibold px-3"
            style={{ color: '#0F0F0F' }}
          >
            {postsCount}
          </span>
          
          {/* Followers */}
          <button
            onClick={() => {
              setActiveMiniNav('followers');
              navigate(`/profile/${username}/followers`);
            }}
            className="relative px-3 pb-3"
          >
            <span 
              className="text-[15px] font-semibold"
              style={{ color: '#0F0F0F' }}
            >
              Followers
            </span>
            {activeMiniNav === 'followers' && (
              <div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-[52px] rounded-full"
                style={{ background: '#0F0F0F' }}
              />
            )}
          </button>
          
          {/* Followers count */}
          <span 
            className="text-[15px] font-semibold px-3"
            style={{ color: '#0F0F0F' }}
          >
            {followersCount}
          </span>
          
          {/* Friends */}
          {isPersonal && (
            <>
              <button
                onClick={() => {
                  setActiveMiniNav('friends');
                  navigate(`/profile/${username}/friends`);
                }}
                className="relative px-3 pb-3"
              >
                <span 
                  className="text-[15px] font-semibold"
                  style={{ color: '#0F0F0F' }}
                >
                  Friends
                </span>
                {activeMiniNav === 'friends' && (
                  <div 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-[52px] rounded-full"
                    style={{ background: '#0F0F0F' }}
                  />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* White content sheet - rounded-t-[22px], starts immediately after mini-nav */}
      <div 
        className="bg-white pt-5 pb-32 min-h-[60vh]"
        style={{ borderRadius: '22px 22px 0 0' }}
      >
        {/* About section - directly on white, no card */}
        <section className="px-5 mb-6">
          <h3 
            className="text-xl font-bold mb-2"
            style={{ color: '#0F0F0F' }}
          >
            About
          </h3>
          <p 
            className="text-base leading-relaxed"
            style={{ color: '#0F0F0F' }}
          >
            {profile?.bio || 'Passionate golfer with a love for links courses. Always working to improve my game and explore new courses.'}
          </p>
          <div className="flex justify-end mt-2">
            <button className="text-base font-medium" style={{ color: '#0066FF' }}>
              See more
            </button>
          </div>
        </section>

        {/* Golf Snapshot - table-style cards */}
        <section className="px-5 mb-6">
          <h3 
            className="text-xl font-bold mb-3"
            style={{ color: '#0F0F0F' }}
          >
            Golf Snapshot
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Left card */}
            <div 
              className="rounded-2xl overflow-hidden bg-white"
              style={{ border: '1px solid rgba(15,15,15,0.10)' }}
            >
              <div 
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(15,15,15,0.08)' }}
              >
                <span className="text-sm" style={{ color: '#0F0F0F' }}>Handicap</span>
                <span className="text-sm font-semibold" style={{ color: '#0F0F0F' }}>
                  {formatHandicap(profile?.eg_handicap_index)}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm" style={{ color: '#0F0F0F' }}>Home Club</span>
                <span className="text-sm font-semibold truncate max-w-[100px]" style={{ color: '#0F0F0F' }}>
                  {profile?.home_club ? profile.home_club.split(' ')[0] : '–'}
                </span>
              </div>
            </div>

            {/* Right card */}
            <div 
              className="rounded-2xl overflow-hidden bg-white"
              style={{ border: '1px solid rgba(15,15,15,0.10)' }}
            >
              <div 
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(15,15,15,0.08)' }}
              >
                <span className="text-sm" style={{ color: '#0F0F0F' }}>Top 100</span>
                <span className="text-sm font-semibold" style={{ color: '#0F0F0F' }}>
                  {top100Count}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm" style={{ color: '#0F0F0F' }}>Rounds</span>
                <span className="text-sm font-semibold" style={{ color: '#0F0F0F' }}>{roundsLogged}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Achievements - directly on white, no outer card */}
        {isPersonal && unlockedAchievements.length > 0 && (
          <section className="px-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 
                className="text-xl font-bold"
                style={{ color: '#0F0F0F' }}
              >
                Achievements
              </h3>
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
                    border: '1px solid rgba(15,15,15,0.10)'
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                    style={{ background: 'rgba(139,115,85,0.15)' }}
                  >
                    <Trophy className="w-4 h-4" style={{ color: '#8B7355' }} />
                  </div>
                  <div className="text-sm font-semibold" style={{ color: '#0F0F0F' }}>
                    {achievement.label}
                  </div>
                  <div className="text-xs" style={{ color: '#0F0F0F' }}>
                    {achievement.shortLabel}
                  </div>
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
                border: '1px solid rgba(15,15,15,0.10)'
              }}
            >
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id}
                  className="rounded-full text-sm px-3 py-1.5 font-medium transition-all duration-150 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  style={{ color: '#0F0F0F' }}
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
