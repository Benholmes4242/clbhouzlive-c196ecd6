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
import { Settings, ArrowLeft, Share2, Trophy, ChevronRight, MoreHorizontal, Send } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfileAchievements } from '@/hooks/useProfileAchievements';

// Tab content components
import ActivityFeed from '@/components/profile/ActivityFeed';
import { ProfileCoursesTab } from '@/components/profile/ProfileCoursesTab';
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';
import AchievementsPane from '@/components/profile/AchievementsPane';
import HandicapSection from '@/components/profile/HandicapSection';

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

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F5F7' }}>
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
    <PageRoot className="min-h-screen" style={{ background: '#F4F5F7' }}>
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
          {/* Subtle fade at very bottom only */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, transparent 70%, rgba(244,245,247,0.5) 90%, #F4F5F7 100%)'
            }}
          />
        </div>
        
        {/* Navigation buttons - dark glass style */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 safe-top">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-md flex items-center justify-center bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              className="w-9 h-9 rounded-md flex items-center justify-center bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors"
              aria-label="Share profile"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-9 h-9 rounded-md flex items-center justify-center bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Avatar - squircle with tan/brown ring */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-16 z-20">
          <div 
            className="w-[120px] h-[120px] rounded-[24px] overflow-hidden"
            style={{
              border: '4px solid #8B7355',
              boxShadow: '0 12px 30px rgba(15,15,15,0.22)'
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

      {/* Identity Stack */}
      <div className="pt-20 px-4 text-center">
        {/* Name */}
        <h1 className="text-[32px] font-bold text-[#0F0F0F]">
          {displayName}
        </h1>
        
        {/* Headline row: Golfer · Club   HCP pill */}
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="text-base text-[#4A4A4A]">
            Golfer
            {profile?.home_club && (
              <> · {profile.home_club}</>
            )}
          </span>
          {profile?.eg_handicap_index != null && (
            <span 
              className="px-3 py-1 text-sm font-semibold rounded-md"
              style={{
                background: '#fff',
                border: '1px solid #E0E0E0',
                color: '#1F1F1F'
              }}
            >
              HCP {profile.eg_handicap_index}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons - exact match */}
      <div className="mt-5 px-4 flex items-center justify-center gap-3">
        {/* Follow - blue filled pill */}
        <button 
          className="flex-1 max-w-[180px] h-12 px-6 rounded-full text-base font-semibold text-white flex items-center justify-center"
          style={{ background: '#0066FF' }}
        >
          Follow
        </button>
        
        {/* Message - white outline pill */}
        <button 
          className="flex-1 max-w-[180px] h-12 px-6 rounded-full text-base font-semibold text-[#1F1F1F] flex items-center justify-center gap-2"
          style={{
            background: '#fff',
            border: '1px solid #E0E0E0'
          }}
        >
          <Send className="w-4 h-4" />
          Message
        </button>
        
        {/* More - circular */}
        <button 
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: '#fff',
            border: '1px solid #E0E0E0'
          }}
        >
          <MoreHorizontal className="w-5 h-5 text-[#1F1F1F]" />
        </button>
      </div>

      {/* Mini-nav row: About | 57 Followers | 9 Friends */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between border-b border-[#E8E8E8]">
          {/* About */}
          <button
            onClick={() => setActiveMiniNav('about')}
            className="relative pb-3 px-2"
          >
            <span className={`text-base font-medium ${activeMiniNav === 'about' ? 'text-[#0F0F0F]' : 'text-[#6B6B6B]'}`}>
              About
            </span>
            {activeMiniNav === 'about' && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0F0F0F] rounded-full" />
            )}
          </button>
          
          {/* Followers with count */}
          <button
            onClick={() => {
              setActiveMiniNav('followers');
              navigate(`/profile/${username}/followers`);
            }}
            className="relative pb-3 px-2"
          >
            <span className={`text-base ${activeMiniNav === 'followers' ? 'text-[#0F0F0F]' : 'text-[#6B6B6B]'}`}>
              <span className="font-semibold">{followersCount}</span>
              <span className="font-medium ml-1">Followers</span>
            </span>
            {activeMiniNav === 'followers' && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0F0F0F] rounded-full" />
            )}
          </button>
          
          {/* Friends with count */}
          {isPersonal && (
            <button
              onClick={() => {
                setActiveMiniNav('friends');
                navigate(`/profile/${username}/friends`);
              }}
              className="relative pb-3 px-2"
            >
              <span className={`text-base ${activeMiniNav === 'friends' ? 'text-[#0F0F0F]' : 'text-[#6B6B6B]'}`}>
                <span className="font-semibold">{friendsCount}</span>
                <span className="font-medium ml-1">Friends</span>
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
          <p className="text-base text-[#4A4A4A] leading-relaxed">
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
                <span className="text-sm text-[#4A4A4A]">Handicap</span>
                <span className="text-sm font-semibold text-[#0F0F0F]">{profile?.eg_handicap_index ?? '–'}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#4A4A4A]">Home Club</span>
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
                <span className="text-sm text-[#4A4A4A]">Home Club</span>
                <span className="text-sm font-semibold text-[#0F0F0F] truncate max-w-[100px]">
                  {profile?.home_club ? profile.home_club.split(' ')[0] : '–'}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#4A4A4A]">Rounds Logged</span>
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
                  <div className="text-xs text-[#6B6B6B]">{achievement.shortLabel}</div>
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
                    color: activeSection === tab.id ? '#0F0F0F' : '#6B6B6B'
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
    </PageRoot>
  );
};

export default ProfilePageV2;
