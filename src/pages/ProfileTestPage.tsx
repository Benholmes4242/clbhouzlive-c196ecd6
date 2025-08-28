import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import HeroProfileHeader from '@/components/profile/HeroProfileHeader';
import UserCoursesContent from '@/components/courses/UserCoursesContent';
import { CorsConfigTool } from '@/components/admin/CorsConfigTool';
import { useProfileData } from '@/hooks/useProfileData';
import { useQueryClient } from '@tanstack/react-query';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { Flag, Globe, Compass, Trophy } from 'lucide-react';

const ProfileTestPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('activity');
  const queryClient = useQueryClient();
  
  // Only invalidate profile cache on initial page load, not on remounts
  useEffect(() => {
    // Only invalidate if we're coming from a different route or initial load
    const hasInitialized = sessionStorage.getItem('profile-test-initialized');
    if (!hasInitialized) {
      console.log('ProfileTestPage initial load - invalidating profile cache');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      sessionStorage.setItem('profile-test-initialized', 'true');
    }
  }, []); // Remove queryClient dependency to prevent retriggering
  
  const {
    user,
    profile,
    loading,
    error,
    setProfile,
    fetchProfile,
    refreshProfile,
    updateProfileField
  } = useProfileData();

  const { achievements } = useUserAchievements(user?.id ? parseInt(user.id) : undefined);

  // Achievement rings data
  const achievementRings = [
    { id: '1', title: 'Britain & Ireland', icon: Flag, color: '#10b981', region: 'britain-ireland' },
    { id: '2', title: 'Continental Europe', icon: Globe, color: '#3b82f6', region: 'europe' },
    { id: '3', title: 'USA', icon: Compass, color: '#f59e0b', region: 'usa' },
    { id: '4', title: 'Global Top 100', icon: Trophy, color: '#ef4444', region: 'global' },
  ];

  // Mock progress data for demonstration
  const getProgressData = (region: string) => {
    const mockData = {
      'britain-ireland': { played: 12, total: 20, percentage: 60 },
      'europe': { played: 8, total: 15, percentage: 53 },
      'usa': { played: 25, total: 50, percentage: 50 },
      'global': { played: 35, total: 100, percentage: 35 }
    };
    return mockData[region] || { played: 0, total: 0, percentage: 0 };
  };

  // Redirect to auth page if user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
              style={{ borderBottomColor: '#6e9277' }}
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
    <div className="min-h-screen bg-background pb-28 relative">
      {/* Header */}
      <Header />
      
      {/* Test Page Banner */}
      <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2 text-center">
        <span className="text-yellow-600 font-medium text-sm">TEST PAGE - Profile Clone</span>
      </div>
      
      {/* Progress Rings on Page Background */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none">
        <div className="flex gap-8 justify-center">
          {achievementRings.map((achievement, index) => {
            const progress = getProgressData(achievement.region);
            const animationDelay = index * 0.2;
            const completedAngle = (progress.percentage / 100) * 283; // 283 is circumference for strokeDasharray
            
            return (
              <div key={achievement.id} className="flex flex-col items-center opacity-20">
                <div className="w-44 h-44 relative transition-all duration-300">
                  {/* Progress Ring with Full Circle */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    {/* Gradient Definitions */}
                    <defs>
                      <linearGradient id={`gradient-${achievement.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={achievement.color} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={achievement.color} stopOpacity="0.7" />
                      </linearGradient>
                    </defs>
                    
                    {/* Remaining portion (full ring) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    
                    {/* Completed portion with animated sweep */}
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="none"
                      stroke={achievement.color}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      strokeDashoffset={283 - completedAngle}
                      className="transition-all duration-1000 ease-out"
                      style={{
                        filter: `drop-shadow(0 0 15px ${achievement.color}50)`,
                        animationDelay: `${animationDelay}s`
                      }}
                    />
                  </svg>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="text-2xl text-black leading-none">
                      <span>{progress.played}</span>
                      <span className="text-black/60"> / {progress.total}</span>
                    </div>
                    <div className="text-xl text-black mt-1">
                      {progress.played * 120} XP
                    </div>
                  </div>
                </div>
                
                {/* Achievement title */}
                <div className="mt-0.5 text-center max-w-[200px]">
                  <div className="text-xl text-foreground">
                    {achievement.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <HeroProfileHeader 
        profile={profile}
        isOwnProfile={true} // This is always the user's own profile on this route
        onProfileUpdate={refreshProfile}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      {/* Activity content is now handled by ActivityFeed within HeroProfileHeader */}
      
      
      <BottomNavigation />
    </div>
  );
};

export default ProfileTestPage;