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
import { Settings, ArrowLeft, Share2, Trophy, ChevronRight, MoreHorizontal, UserPlus, MessageCircle } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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

  return (
    <PageRoot className="min-h-screen" style={{ background: '#F4F5F7' }}>
      {/* Hero Section with fade to light */}
      <div className="relative">
        {/* Hero Image */}
        <div className="relative h-[200px] w-full overflow-hidden">
          {heroUrl ? (
            <img 
              src={heroUrl} 
              alt="Profile cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
          )}
          {/* Fade overlay to light */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(244,245,247,0) 30%, rgba(244,245,247,1) 100%)'
            }}
          />
        </div>
        
        {/* Navigation buttons */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 safe-top">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(31,36,40,0.10)',
              backdropFilter: 'blur(6px)'
            }}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(31,36,40,0.10)',
                backdropFilter: 'blur(6px)'
              }}
              aria-label="Share profile"
            >
              <Share2 className="w-5 h-5 text-slate-700" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(31,36,40,0.10)',
                backdropFilter: 'blur(6px)'
              }}
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </div>

        {/* Avatar - overlapping hero */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-12 z-20">
          <Avatar 
            className="w-[100px] h-[100px]"
            style={{
              border: '4px solid #F4F5F7',
              boxShadow: '0 10px 30px rgba(15,15,15,0.18)'
            }}
          >
            <AvatarImage src={profile?.profile_photo_url || ''} alt={displayName} />
            <AvatarFallback className="text-2xl bg-slate-200 text-slate-600">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Identity Stack */}
      <div className="pt-16 px-4 text-center">
        <h1 className="text-[26px] font-extrabold text-slate-900">{displayName}</h1>
        <div className="mt-1 flex items-center justify-center gap-2 text-slate-600">
          <span className="text-sm">Golfer</span>
          {profile?.home_club && (
            <>
              <span className="text-slate-400">·</span>
              <span className="text-sm">{profile.home_club}</span>
            </>
          )}
          {profile?.eg_handicap_index != null && (
            <span 
              className="ml-1 px-2.5 py-1 text-xs font-bold rounded-full"
              style={{
                background: 'rgba(15,15,15,0.06)',
                border: '1px solid rgba(15,15,15,0.08)'
              }}
            >
              HCP {profile.eg_handicap_index}
            </span>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="mt-4 px-4 flex items-center gap-2">
        <Button 
          className="flex-1 rounded-sq-md"
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
          className="flex-[0.8] rounded-sq-md"
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
          size="icon"
          className="rounded-sq-md"
          style={{
            background: '#fff',
            border: '1px solid rgba(15,15,15,0.15)'
          }}
        >
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Stats Row */}
      <section 
        className="mt-4 mx-4 py-3 flex items-center justify-around rounded-sq-md"
        style={{
          background: '#fff',
          border: '1px solid rgba(15,15,15,0.08)'
        }}
      >
        <button className="flex flex-col items-center">
          <span className="text-base font-bold text-slate-900 tabular-nums">{postsCount}</span>
          <span className="text-[11px] uppercase tracking-wider text-slate-500">Posts</span>
        </button>
        
        {isPersonal && (
          <button 
            onClick={() => navigate(`/profile/${username}/friends`)}
            className="flex flex-col items-center"
          >
            <span className="text-base font-bold text-slate-900 tabular-nums">{friendsCount}</span>
            <span className="text-[11px] uppercase tracking-wider text-slate-500">Friends</span>
          </button>
        )}
        
        <button 
          onClick={() => navigate(`/profile/${username}/following`)}
          className="flex flex-col items-center"
        >
          <span className="text-base font-bold text-slate-900 tabular-nums">{followingCount}</span>
          <span className="text-[11px] uppercase tracking-wider text-slate-500">Following</span>
        </button>
        
        <button 
          onClick={() => navigate(`/profile/${username}/followers`)}
          className="flex flex-col items-center"
        >
          <span className="text-base font-bold text-slate-900 tabular-nums">{followersCount}</span>
          <span className="text-[11px] uppercase tracking-wider text-slate-500">Followers</span>
        </button>
      </section>

      {/* Achievements Section */}
      {isPersonal && unlockedAchievements.length > 0 && (
        <section 
          className="mt-3 mx-4 p-4 rounded-sq-md"
          style={{
            background: '#fff',
            border: '1px solid rgba(15,15,15,0.08)',
            boxShadow: '0 6px 18px rgba(15,15,15,0.06)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Achievements</h3>
            <button 
              onClick={() => navigate('/achievement')}
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
                className="flex-shrink-0 w-[140px] p-3 rounded-sq-md"
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
                <div className="text-sm font-semibold text-slate-900">{achievement.label}</div>
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

      {/* Tabs */}
      <section className="mt-4 px-4">
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
      <div className="pt-4 px-4 pb-32">
        {getCurrentContent()}
      </div>
    </PageRoot>
  );
};

export default ProfilePageV2;
