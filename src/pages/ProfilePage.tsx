
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import ProfileCoverSection from '@/components/profile/ProfileCoverSection';
import ProfilePhotoManager from '@/components/profile/ProfilePhotoManager';
import ProfileInfo from '@/components/profile/ProfileInfo';
import ProfileStatusSection from '@/components/profile/ProfileStatusSection';
import HandicapCard from '@/components/profile/HandicapCard';
import Top100Interactive from '@/components/profile/Top100Interactive';
import AchievementsSection from '@/components/profile/AchievementsSection';
import ProfileTabs from '@/components/profile/ProfileTabs';
import EnhancedSocialActivity from '@/components/profile/EnhancedSocialActivity';
import ProfileSections from '@/components/profile/ProfileSections';
import { useProfileData } from '@/hooks/useProfileData';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData';
import { Trophy, MapPin, Users } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [statusTagline, setStatusTagline] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  
  const {
    user,
    profile,
    loading,
    error,
    setProfile,
    fetchProfile,
    updateProfileField
  } = useProfileData();

  const { regionProgress, isLoading: isLoadingTop100 } = useTop100CoursesData(
    user?.id || '',
    true
  );

  // Redirect to auth page if user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Mock data for new features (in real implementation, these would come from backend)
  const userBadges = [
    { id: '1', type: 'club_member' as const, label: 'Club Member', icon: <Users className="h-3 w-3" /> },
    { id: '2', type: 'low_handicap' as const, label: 'Low Handicap', icon: <Trophy className="h-3 w-3" /> },
  ];

  const achievements = [
    {
      id: '1',
      type: 'first_top100' as const,
      title: 'First Top 100',
      description: 'Played your first Top 100 course',
      icon: <Trophy className="h-4 w-4" />,
      isUnlocked: true,
      unlockedAt: '2024-01-15'
    },
    {
      id: '2',
      type: 'courses_milestone' as const,
      title: '10 Courses',
      description: 'Play 10 Top 100 courses',
      icon: <MapPin className="h-4 w-4" />,
      isUnlocked: false,
      progress: { current: 7, target: 10 }
    }
  ];

  const handleEGVisibilityToggle = async (checked: boolean) => {
    if (!user) return;
    try {
      const updateData: any = { eg_visible: checked };
      await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", user.id);
      updateProfileField('eg_visible', checked);
    } catch (error) {
      console.error('Error updating EG visibility:', error);
    }
  };

  const handleProfileUpdate = () => {
    if (user) {
      fetchProfile(user.id);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!user) return;
    try {
      await supabase
        .from("user_profiles")
        .update({ bio: newStatus })
        .eq("id", user.id);
      setStatusTagline(newStatus);
      updateProfileField('bio', newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCoverUpdate = async (imageUrl: string) => {
    setCoverImage(imageUrl);
    // TODO: Save to database
  };

  const handleRegionClick = (region: string) => {
    navigate('/courses?tab=my-courses');
  };

  const handleEGConnect = () => {
    // TODO: Implement EG App connection
    console.log('Connect to EG App');
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
              style={{ borderBottomColor: '#b66b41' }}
            ></div>
            <span className="text-muted-foreground text-base">Loading...</span>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // Show error if there's an issue
  if (error) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <span className="text-destructive text-base">Error loading profile</span>
            <button 
              onClick={() => window.location.reload()} 
              className="block mx-auto text-sm text-muted-foreground hover:text-foreground"
            >
              Try refreshing the page
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-28">
      <Header />
      <div className="max-w-2xl mx-auto">
        {/* Cover Section */}
        <ProfileCoverSection 
          coverImageUrl={coverImage}
          isOwnProfile={true}
          onCoverUpdate={handleCoverUpdate}
        />
        
        {/* Profile Photo (overlapping cover) */}
        <div className="relative -mt-20 px-4">
          <ProfilePhotoManager
            user={user}
            profile={profile}
            onProfileUpdate={setProfile}
          />
        </div>

        <div className="px-4 mt-4">
          {/* Basic Profile Info */}
          <ProfileInfo
            profile={profile}
            userEmail={user?.email}
            userId={user?.id}
            onProfileUpdate={handleProfileUpdate}
          />

          {/* Status & Badges */}
          <ProfileStatusSection
            statusTagline={profile?.bio || statusTagline}
            badges={userBadges}
            isOwnProfile={true}
            onStatusUpdate={handleStatusUpdate}
          />

          {/* Tabs Navigation */}
          <ProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            children={{
              overview: (
                <div className="space-y-6">
                  <HandicapCard
                    handicapIndex={profile?.eg_handicap_index}
                    egAppConnected={profile?.eg_app_connected || false}
                    lastUpdated={profile?.updated_at}
                    isOwnProfile={true}
                    onEGConnect={handleEGConnect}
                  />
                  
                  <Top100Interactive
                    regionProgress={regionProgress}
                    nextGoalCourse={{ name: 'Royal Birkdale', region: 'Britain & Ireland' }}
                    yearlyTarget={{ target: 20, current: 12 }}
                    onRegionClick={handleRegionClick}
                    isOwnProfile={true}
                  />
                  
                  <AchievementsSection
                    achievements={achievements}
                    isOwnProfile={true}
                  />
                </div>
              ),
              top100: (
                <ProfileSections
                  profile={profile}
                  user={user}
                  onEGVisibilityToggle={handleEGVisibilityToggle}
                  isOwnProfile={true}
                />
              ),
              activity: (
                <EnhancedSocialActivity
                  userId={user.id}
                  isOwnProfile={true}
                  profileDisplayName={profile?.display_name}
                />
              ),
              stats: (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Stats coming soon...</p>
                </div>
              ),
              courses: (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Course details coming soon...</p>
                </div>
              )
            }}
          />
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
