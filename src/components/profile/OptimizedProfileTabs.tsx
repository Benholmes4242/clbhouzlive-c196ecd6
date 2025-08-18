import React, { lazy, Suspense } from 'react';
import { ProfileTabsSkeleton, ActivityFeedSkeleton } from './ProfileSkeleton';
import OptimizedActivityFeed from './OptimizedActivityFeed';
import ClubhouseAchievementsTray from '@/components/achievements/ClubhouseAchievementsTray';
import { OptimizedProfileData } from '@/hooks/useOptimizedProfileData';

// Lazy load heavy components for better initial load
const CourseHighlightsCarousel = lazy(() => import('./CourseHighlightsCarousel'));
const CoursesJourney = lazy(() => import('./CoursesJourney'));
const PinnedAchievements = lazy(() => import('./PinnedAchievements'));
const ProfileProgressSection = lazy(() => import('./ProfileProgressSection'));

interface OptimizedProfileTabsProps {
  profileData: OptimizedProfileData;
  isOwnProfile: boolean;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const TabButton: React.FC<{
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
}> = ({ id, label, isActive, onClick, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 ${
      isActive
        ? 'text-primary border-primary'
        : 'text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground'
    }`}
  >
    {label}
    {count !== undefined && count > 0 && (
      <span className="ml-2 px-2 py-1 text-xs bg-muted rounded-full">
        {count}
      </span>
    )}
  </button>
);

const OptimizedProfileTabs: React.FC<OptimizedProfileTabsProps> = ({
  profileData,
  isOwnProfile,
  activeSection,
  onSectionChange
}) => {
  const tabs = [
    { id: 'activity', label: 'Activity', count: profileData.recentPosts.length },
    { id: 'courses', label: 'Courses', count: profileData.coursesPlayed },
    { id: 'progress', label: 'Progress' },
    { id: 'achievements', label: 'Achievements', count: profileData.recentAchievements.length },
    { id: 'highlights', label: 'Highlights' }
  ];

  const renderTabContent = () => {
    switch (activeSection) {
      case 'activity':
        return (
          <OptimizedActivityFeed 
            posts={profileData.recentPosts}
            isLoading={false}
          />
        );
      
      case 'courses':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Courses Played ({profileData.coursesPlayed})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profileData.topRankedCourses.map((course: any, index: number) => (
                <div key={index} className="bg-card rounded-lg border p-4">
                  <h3 className="font-semibold">{course.golf_courses?.country}</h3>
                  <p className="text-sm text-muted-foreground">
                    Global Rank: {course.golf_courses?.global_rank || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Regional Rank: {course.golf_courses?.regional_rank || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'progress':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Progress Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Courses Played</h3>
                <p className="text-3xl font-bold text-primary">{profileData.coursesPlayed}</p>
              </div>
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Courses Rated</h3>
                <p className="text-3xl font-bold text-primary">{profileData.coursesRated}</p>
              </div>
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Average Rating</h3>
                <p className="text-3xl font-bold text-primary">
                  {profileData.averageRating ? `${profileData.averageRating}/10` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'achievements':
        return (
          <div className="space-y-6">
            <ClubhouseAchievementsTray 
              userId={profileData.profile?.id || ''}
              isOwnProfile={isOwnProfile}
              userDisplayName={profileData.profile?.display_name || 'User'}
            />
          </div>
        );
      
      case 'highlights':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">
              {isOwnProfile ? "My Highlights" : `${profileData.profile?.display_name?.split(' ')[0] || 'User'}'s Highlights`}
            </h2>
            <p className="text-muted-foreground">Course highlights coming soon...</p>
          </div>
        );
      
      default:
        return (
          <OptimizedActivityFeed 
            posts={profileData.recentPosts}
            isLoading={false}
          />
        );
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Tabs Navigation */}
      <div className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex gap-8 overflow-x-auto scrollbar-hide py-4">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                id={tab.id}
                label={tab.label}
                isActive={activeSection === tab.id}
                onClick={() => onSectionChange(tab.id)}
                count={tab.count}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default OptimizedProfileTabs;