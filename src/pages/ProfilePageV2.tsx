/**
 * ProfilePageV2 - LinkedIn-style Light Profile
 * Hero identity with section-based content
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile.tsx';
import { useTop100Overview } from '@/hooks/useTop100Overview';
import { useActivityPosts } from '@/components/profile/hooks/useActivityPosts';
import { getProfileType, getProfileTabs } from '@/hooks/useProfileType';
import { supabase } from '@/integrations/supabase/client';
import { Settings, ArrowLeft, Share2, Trophy, ChevronRight, MoreHorizontal, UserPlus, MessageCircle, MapPin, Flag } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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

  const miniNavItems = [
    { id: 'about', label: 'About' },
    { id: 'followers', label: 'Followers', count: followersCount },
    { id: 'friends', label: 'Friends', count: friendsCount },
  ];

  return (
    <PageRoot className="min-h-screen" style={{ background: '#F4F5F7' }}>
      {/* A) Hero Section - taller with later fade */}
      <div className="relative">
        {/* Hero Image - increased height */}
        <div className="relative h-[240px] w-full overflow-hidden">
          {heroUrl ? (
            <img 
              src={heroUrl} 
              alt="Profile cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
          )}
          {/* Fade overlay - starts later so photo lasts longer */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, transparent 55%, rgba(244,245,247,0.7) 80%, #F4F5F7 100%)'
            }}
          />
        </div>
        
        {/* Navigation buttons */}
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

        {/* B) Avatar - squircle, not circle */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-14 z-20">
          <div 
            className="w-[110px] h-[110px] rounded-[22px] overflow-hidden"
            style={{
              border: '4px solid #F4F5F7',
              boxShadow: '0 12px 30px rgba(15,15,15,0.18)'
            }}
          >
            {profile?.profile_photo_url ? (
              <img 
                src={profile.profile_photo_url} 
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-600">
                {displayName.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* C) Identity Stack - bolder name, grey HCP pill */}
      <div className="pt-[72px] px-4 text-center">
        <h1 
          className="text-[30px] font-extrabold text-[#0F0F0F]"
          style={{ letterSpacing: '-0.02em' }}
        >
          {displayName}
        </h1>
        <div className="mt-1.5 flex items-center justify-center gap-2 text-slate-600">
          <span className="text-sm">Golfer</span>
          {profile?.home_club && (
            <>
              <span className="text-slate-400">·</span>
              <span className="text-sm">{profile.home_club}</span>
            </>
          )}
          {profile?.eg_handicap_index != null && (
            <span 
              className="ml-1 px-3 py-1.5 text-xs font-bold rounded-full"
              style={{
                background: 'rgba(15,15,15,0.06)',
                border: '1px solid rgba(15,15,15,0.08)',
                color: 'rgba(15,15,15,0.8)'
              }}
            >
              HCP {profile.eg_handicap_index}
            </span>
          )}
        </div>
      </div>

      {/* D) Action Bar - shorter buttons */}
      <div className="mt-4 px-4 flex items-center gap-2">
        <Button 
          className="flex-1 h-11 px-4 rounded-xl text-sm font-semibold"
          style={{
            background: '#1F2428',
            color: '#fff'
          }}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Friend
        </Button>
        <Button 
          variant="outline"
          className="flex-[0.8] h-11 px-4 rounded-xl text-sm font-semibold"
          style={{
            background: '#fff',
            border: '1px solid rgba(15,15,15,0.15)'
          }}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Message
        </Button>
        <Button 
          variant="ghost"
          className="h-11 w-11 p-0 rounded-xl"
          style={{
            background: '#fff',
            border: '1px solid rgba(15,15,15,0.15)'
          }}
        >
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* E) Mini-nav row on off-white with underline */}
      <div className="mt-5 px-4">
        <div className="flex items-center justify-center gap-8">
          {miniNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveMiniNav(item.id);
                if (item.id === 'followers') {
                  navigate(`/profile/${username}/followers`);
                } else if (item.id === 'friends') {
                  navigate(`/profile/${username}/friends`);
                }
              }}
              className="relative pb-2 flex flex-col items-center"
            >
              <span 
                className={`text-sm font-medium transition-colors ${
                  activeMiniNav === item.id ? 'text-[#0F0F0F]' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
              {item.count !== undefined && (
                <span className="text-xs text-slate-400">{item.count}</span>
              )}
              {/* Black underline for active item */}
              {activeMiniNav === item.id && (
                <div 
                  className="absolute -bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ background: '#0F0F0F' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* F) White content sheet */}
      <div 
        className="mt-4 rounded-t-[22px] pt-5 pb-32"
        style={{
          background: '#fff',
          borderTop: '1px solid rgba(15,15,15,0.06)'
        }}
      >
        {/* G) About section - plain text on white, no card */}
        <section className="px-5 mb-5">
          <h3 className="text-sm font-semibold text-[#0F0F0F] mb-2">About</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {profile?.bio || 'No bio yet. Add one to tell other golfers about yourself.'}
          </p>
          {profile?.bio && profile.bio.length > 120 && (
            <button className="text-sm font-medium mt-1" style={{ color: '#F7931E' }}>
              See more
            </button>
          )}
        </section>

        {/* H) Golf Snapshot - two cards side by side */}
        <section className="px-5 mb-5">
          <h3 className="text-sm font-semibold text-[#0F0F0F] mb-3">Golf Snapshot</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Handicap + Home Club */}
            <div 
              className="p-4 rounded-2xl"
              style={{
                background: '#fff',
                border: '1px solid rgba(15,15,15,0.10)'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Flag className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">Handicap</span>
              </div>
              <div className="text-xl font-bold text-[#0F0F0F]">
                {profile?.eg_handicap_index ?? '–'}
              </div>
              {profile?.home_club && (
                <div className="mt-2 text-xs text-slate-500 truncate">
                  {profile.home_club}
                </div>
              )}
            </div>

            {/* Card 2: Top 100 Played */}
            <div 
              className="p-4 rounded-2xl"
              style={{
                background: '#fff',
                border: '1px solid rgba(15,15,15,0.10)'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">Top 100 Played</span>
              </div>
              <div className="text-xl font-bold text-[#0F0F0F]">
                {top100Count}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {postsCount} posts shared
              </div>
            </div>
          </div>
        </section>

        {/* I) Achievements - on white, no outer card wrapper */}
        {isPersonal && unlockedAchievements.length > 0 && (
          <section className="px-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#0F0F0F]">Achievements</h3>
              <button 
                onClick={() => navigate('/profile/quest')}
                className="text-sm font-semibold flex items-center gap-1"
                style={{ color: '#F7931E' }}
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {unlockedAchievements.slice(0, 3).map((achievement) => (
                <div 
                  key={achievement.id}
                  className="flex-shrink-0 w-[140px] p-3 rounded-2xl"
                  style={{
                    background: '#FAFAFA',
                    border: '1px solid rgba(15,15,15,0.06)'
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
                    style={{ background: 'rgba(247,147,30,0.14)' }}
                  >
                    <Trophy className="w-4 h-4" style={{ color: '#F7931E' }} />
                  </div>
                  <div className="text-sm font-semibold text-[#0F0F0F]">{achievement.label}</div>
                  <div className="text-xs text-slate-500">{achievement.shortLabel}</div>
                  <span 
                    className="inline-block mt-2 px-2 py-0.5 text-[10px] font-medium rounded-full"
                    style={{
                      background: 'rgba(15,15,15,0.06)',
                      color: '#5E666D'
                    }}
                  >
                    Unlocked
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* J) Tabs row - inside white content sheet */}
        <section className="px-5">
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList 
              className="grid w-full rounded-full px-1.5 py-1"
              style={{ 
                gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
                background: '#EDEFF2',
                border: '1px solid rgba(15,15,15,0.08)'
              }}
            >
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id}
                  className="rounded-full text-sm px-3 py-1.5 font-medium transition-all duration-150"
                  style={{
                    color: activeSection === tab.id ? '#1F2428' : '#5E666D',
                    background: activeSection === tab.id ? '#fff' : 'transparent',
                    boxShadow: activeSection === tab.id ? '0 6px 14px rgba(15,15,15,0.08)' : 'none'
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
