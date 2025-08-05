import React, { useState, useEffect } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { useStaggeredInView } from '@/hooks/useInViewAnimation';
import { useScrollPerformance } from '@/hooks/usePerformanceOptimizations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProfileFormFields from "./ProfileFormFields";
import { useProfileForm } from "./hooks/useProfileForm";
import { useActivityPosts } from './hooks/useActivityPosts';
import ActivityFeed from './ActivityFeed';
import { ActivityPost } from './types/ActivityTypes';
import ActivityHeader from './components/ActivityHeader';
import ActivityPostCard from './components/ActivityPostCard';
import PostViewerModal from '../posts/PostViewerModal';
import { usePostViewer } from '@/hooks/usePostViewer';
import { extractGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import UserCoursesContent from '@/components/courses/UserCoursesContent';
import LatestHighlights from '@/components/courses/highlights/LatestHighlights';
import HandicapSection from './HandicapSection';
import ProfileSectionCarousel from './ProfileSectionCarousel';
import { createDynamicBackgroundStyle } from '@/utils/backgroundGenerator';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';
import ProfileBadgeStrip from './ProfileBadgeStrip';
import ProfileProgressSection from './ProfileProgressSection';
import CompareProgressModal from './CompareProgressModal';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { Swords, MoreHorizontal } from 'lucide-react';
import ProfileVideoCircle from './ProfileVideoCircle';
import { useCloudflareStream } from '@/hooks/useCloudflareStream';
import { useR2Upload } from '@/hooks/useR2Upload';

interface Course {
  id: string;
  name: string;
  thumbnail_image?: string;
  global_rank?: number;
  regional_rank?: number;
  usa_rank?: number;
}

interface UserProfile {
  id: string;
  display_name?: string;
  username?: string;
  home_club?: string;
  profile_photo_url?: string;
  profile_video_url?: string;
  profile_video_thumbnail_url?: string;
  has_profile_video?: boolean;
  background_image_url?: string;
  cover_photo_url?: string;
  bio?: string;
  eg_handicap_index?: number;
  eg_app_connected?: boolean;
  user_type?: string;
  is_public?: boolean;
}

interface AchievementRing {
  level: number;
  title: string;
  ringClass: string;
  color: string;
  courses: number;
}

interface HeroProfileHeaderProps {
  profile: UserProfile | null;
  isOwnProfile: boolean;
  onProfileUpdate: () => void;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const HeroProfileHeader = ({ 
  profile, 
  isOwnProfile,
  onProfileUpdate,
  activeSection = 'activity',
  onSectionChange
}: HeroProfileHeaderProps) => {
  const { user } = useSupabaseSession();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { uploadVideo, uploading: videoUploading } = useCloudflareStream();
  const { uploadImage, uploading: photoUploading } = useR2Upload();
  
  // Stats state
  const [ratedCoursesCount, setRatedCoursesCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isStatsDrawerOpen, setIsStatsDrawerOpen] = useState(false);
  const [userProgressData, setUserProgressData] = useState({
    coursesPlayed: 0,
    britainIrelandCompleted: 0,
    europeCompleted: 0,
    usaCompleted: 0,
    worldwideCompleted: 0
  });
  
  // Fetch user achievements for current user
  const { achievements } = useUserAchievements();
  
  // Removed scroll compression logic
  
  // Activity posts logic
  const { posts, loading: postsLoading, fetchUserPosts } = useActivityPosts(profile?.id);
  const { isOpen, currentPost, allUserPosts: viewerPosts, openPostViewer, closePostViewer } = usePostViewer({ source: 'profile' });
  const [selectedPost, setSelectedPost] = useState<ActivityPost | null>(null);
  
  // Fetch stats data including progress
  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return;
      
      try {
        // Fetch rated courses count and average rating
        const { data: ratingsData, error: ratingsError } = await supabase
          .from('course_ratings')
          .select('rating')
          .eq('user_id', profile.id);
          
        if (ratingsError) {
          console.error('Error fetching ratings:', ratingsError);
          return;
        }
        
        if (ratingsData && ratingsData.length > 0) {
          setRatedCoursesCount(ratingsData.length);
          const avgRating = ratingsData.reduce((sum, r) => sum + Number(r.rating), 0) / ratingsData.length;
          setAverageRating(Math.round(avgRating * 10) / 10); // Round to 1 decimal place
        } else {
          setRatedCoursesCount(0);
          setAverageRating(0);
        }

        // Fetch followers count
        const { count: followersCount, error: followersError } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profile.id);

        if (followersError) {
          console.error('Error fetching followers:', followersError);
        } else {
          setFollowersCount(followersCount || 0);
        }

        // Fetch following count
        const { count: followingCount, error: followingError } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profile.id);

        if (followingError) {
          console.error('Error fetching following:', followingError);
        } else {
          setFollowingCount(followingCount || 0);
        }

        // Fetch progress data for course counts
        const { data: top100Data } = await supabase
          .from('user_top100_courses')
          .select(`
            course_id,
            golf_courses (
              country,
              continent,
              global_rank,
              regional_rank,
              usa_rank
            )
          `)
          .eq('user_id', profile.id)
          .eq('played', true);

        const { data: ratedCoursesData } = await supabase
          .from('course_ratings')
          .select(`
            course_id,
            golf_courses (
              country,
              continent,
              global_rank,
              regional_rank,
              usa_rank
            )
          `)
          .eq('user_id', profile.id);

        // Combine and deduplicate courses
        const allCourses = [...(top100Data || []), ...(ratedCoursesData || [])];
        const uniqueCourses = allCourses.filter((course, index, self) => 
          index === self.findIndex(c => c.course_id === course.course_id)
        );

        let britainIrelandCompleted = 0;
        let europeCompleted = 0;
        let usaCompleted = 0;
        let worldwideCompleted = 0;

        uniqueCourses.forEach((courseData) => {
          const course = courseData.golf_courses;
          if (!course) return;

          const isTop100 = course.global_rank || course.regional_rank || course.usa_rank;
          if (isTop100) {
            worldwideCompleted++;

            if (course.country === 'Britain & Ireland') {
              britainIrelandCompleted++;
            }
            
            if (course.country === 'USA') {
              usaCompleted++;
            }
          }

          if (course.country === 'Continental Europe' && course.regional_rank && course.regional_rank <= 100) {
            europeCompleted++;
          }
        });

        setUserProgressData({
          coursesPlayed: worldwideCompleted,
          britainIrelandCompleted,
          europeCompleted,
          usaCompleted,
          worldwideCompleted
        });

      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    
    fetchStats();
  }, [profile?.id]);
  
  // Derived values
  const displayName = profile?.display_name || 'User';
  const username = profile?.username;
  const homeClub = profile?.home_club || 'No Club';
  const postsCount = posts.length; // Use actual posts count
  
  // Animation hook for badges
  const badgesAnimation = useStaggeredInView(5, { threshold: 0.1, staggerDelay: 100 });

  // Profile form hook
  const {
    formData,
    saving,
    isUsernameSet,
    handleInputChange,
    handleHandicapChange,
    handlePublicToggle,
    handleTextareaChange,
    handleSelectChange,
    handleSave,
  } = useProfileForm(profile, user?.id || '', onProfileUpdate, () => setEditDialogOpen(false));
  
  // Removed scroll event listeners


  // Achievement ring calculation
  const getAchievementRing = (coursesPlayed: number): AchievementRing => {
    if (coursesPlayed >= 300) {
      return { level: 5, title: "🌈 Club Collector", ringClass: "ring-gradient", color: "gradient", courses: 300 };
    } else if (coursesPlayed >= 200) {
      return { level: 4, title: "🟢 Clubhouse Elite", ringClass: "ring-green", color: "#32CD32", courses: 200 };
    } else if (coursesPlayed >= 100) {
      return { level: 3, title: "💙 Century Club", ringClass: "ring-blue", color: "#1E90FF", courses: 100 };
    } else if (coursesPlayed >= 50) {
      return { level: 2, title: "🥈 The 50 Club", ringClass: "ring-silver", color: "#C0C0C0", courses: 50 };
    } else if (coursesPlayed >= 20) {
      return { level: 1, title: "🟡 The 20 Club", ringClass: "ring-gold", color: "#FFD700", courses: 20 };
    } else {
      return { level: 0, title: "", ringClass: "ring-none", color: "transparent", courses: 0 };
    }
  };

  const achievementRing = getAchievementRing(userProgressData.coursesPlayed);

  const handleVideoUpload = async (file: File) => {
    try {
      const result = await uploadVideo(file);
      
      if (!result.success) {
        toast({
          title: "Upload Failed",
          description: result.error || "Failed to upload video",
          variant: "destructive"
        });
        return;
      }

      // Update profile with video URLs
      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_video_url: result.videoUrl,
          profile_video_thumbnail_url: result.thumbnailUrl,
          has_profile_video: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Profile video uploaded successfully!",
        variant: "default"
      });

      onProfileUpdate();
    } catch (error) {
      console.error('Error updating profile video:', error);
      toast({
        title: "Update Failed",
        description: "Failed to save video to profile",
        variant: "destructive"
      });
    }
  };

  const handleVideoRemove = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_video_url: null,
          profile_video_thumbnail_url: null,
          has_profile_video: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Profile video removed successfully!",
        variant: "default"
      });

      onProfileUpdate();
    } catch (error) {
      console.error('Error removing profile video:', error);
      toast({
        title: "Remove Failed",
        description: "Failed to remove video from profile",
        variant: "destructive"
      });
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      const result = await uploadImage(file);
      
      if (!result.success) {
        toast({
          title: "Upload Failed",
          description: result.error || "Failed to upload photo",
          variant: "destructive"
        });
        return;
      }

      // Update profile with photo URL
      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_photo_url: result.imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Profile photo uploaded successfully!",
        variant: "default"
      });

      onProfileUpdate();
      
      console.log('Profile photo updated successfully:', result.imageUrl);
    } catch (error) {
      console.error('Error updating profile photo:', error);
      toast({
        title: "Update Failed",
        description: "Failed to save photo to profile",
        variant: "destructive"
      });
    }
  };




  // Simple refs for animation (removed complex animation hooks)
  const activityRef = React.useRef<HTMLDivElement>(null);
  const top100Ref = React.useRef<HTMLDivElement>(null);
  const badgesRef = React.useRef<HTMLDivElement>(null);

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  // Dynamic height based on active section
  const getBackgroundHeight = () => {
    switch (activeSection) {
      case 'activity': return '1000px';
      case 'top100': return '2200px'; // Fixed height for both mobile and desktop
      case 'handicap': return '2200px'; // Fixed height for both mobile and desktop
      default: return '1300px';
    }
  };

  return (
    <>
      {/* Dynamic Background - Auto-generated from profile photo */}
      <div className="relative w-full bg-background">
        {/* Profile Content */}
        <div className="relative z-10 flex flex-col items-center text-center pt-20 pb-8">
          
          

          {/* Profile Photo/Video */}
          <div className="w-64 h-64 mb-6">
            <div 
              className={`relative rounded-full overflow-hidden transition-all duration-300 w-full h-full ${
                achievementRing.ringClass === 'ring-gold' ? 'border-b-[5px] border-l-[5px] border-yellow-400/70 shadow-[0_0_15px_rgba(255,215,0,0.2)]' :
                achievementRing.ringClass === 'ring-silver' ? 'border-b-[5px] border-l-[5px] border-gray-400/70 shadow-[0_0_15px_rgba(192,192,192,0.2)]' :
                achievementRing.ringClass === 'ring-blue' ? 'border-b-[5px] border-l-[5px] border-blue-400/70 shadow-[0_0_15px_rgba(30,144,255,0.2)]' :
                achievementRing.ringClass === 'ring-green' ? 'border-b-[5px] border-l-[5px] border-green-400/70 shadow-[0_0_15px_rgba(50,205,50,0.2)]' :
                achievementRing.ringClass === 'ring-gradient' ? 'border-b-[5px] border-l-[5px] border-transparent bg-gradient-to-br from-yellow-400/70 to-green-400/70 shadow-[0_0_15px_rgba(255,215,0,0.25)]' :
                ''
              }`}
              title={achievementRing.title}
            >
              <ProfileVideoCircle
                videoUrl={profile?.profile_video_url}
                thumbnailUrl={profile?.profile_video_thumbnail_url}
                profilePhotoUrl={profile?.profile_photo_url}
                displayName={displayName}
                isOwnProfile={isOwnProfile}
                onVideoUpload={handleVideoUpload}
                onPhotoUpload={handlePhotoUpload}
                onVideoRemove={handleVideoRemove}
                uploading={videoUploading || photoUploading}
                className="w-full h-full"
              />
            </div>
          </div>
          
          {/* User Information */}
          <div className="text-center mb-6">
            {/* User's Name */}
            <div className="flex items-center justify-center">
              <h1 className="font-bold text-foreground text-4xl">
                {displayName}
              </h1>
            </div>
            
            {/* Username with Edit Button */}
            {username && (
              <div className="flex items-center justify-center gap-3 mb-2">
                <p className="text-lg text-muted-foreground">
                  @{username}
                </p>
                
                {/* Edit Profile Button - Next to username for own profile */}
                {isOwnProfile && (
                  <button 
                    className="bg-muted border border-border rounded-full text-foreground font-medium hover:bg-muted/80 transition-all duration-300 ease-in-out flex items-center justify-center py-1.5 px-3 text-xs" 
                    onClick={() => setEditDialogOpen(true)}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            )}

            {/* Badge Strip */}
            <div className="mb-3">
              <ProfileBadgeStrip
                coursesPlayed={userProgressData.coursesPlayed}
                totalXP={userProgressData.coursesPlayed * 110}
                britainIrelandCompleted={userProgressData.britainIrelandCompleted}
                europeCompleted={userProgressData.europeCompleted}
                usaCompleted={userProgressData.usaCompleted}
                worldwideCompleted={userProgressData.worldwideCompleted}
              />
            </div>
            
            {/* Home Golf Club */}
            <p className="text-base text-muted-foreground">
              {homeClub}
            </p>

            {/* Compare Progress Button for other profiles */}
            {!isOwnProfile && user && (
              <div className="mt-4">
                <button
                  onClick={() => setIsCompareModalOpen(true)}
                  className="bg-muted border border-border rounded-lg text-foreground font-medium hover:bg-muted/80 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 py-2 px-4 text-sm"
                  style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
                >
                  <Swords className="w-4 h-4" />
                  ⚔️ Compare Golf Journey
                </button>
              </div>
            )}
          </div>

          {/* Stats Bar Container */}
          <div className="w-full max-w-md">
            {/* Main Stats Bar - Always Visible */}
            <div 
              className="w-full bg-muted border border-border rounded-lg py-1" 
              style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
            >
              <div className="flex items-center justify-between w-full px-2">
                {/* Group A - Always Visible Stats */}
                <div className="flex items-center justify-around flex-1 space-x-2">
                  <div className="text-center">
                    <div className="font-bold text-foreground text-lg">
                      {profile?.eg_handicap_index ? profile.eg_handicap_index.toFixed(1) : '--'}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Handicap
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-foreground text-lg">
                      {postsCount}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Posts
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-foreground text-lg">
                      {followersCount}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Followers
                    </div>
                  </div>
                </div>
                
                {/* Three-dot trigger button */}
                <button
                  onClick={() => setIsStatsDrawerOpen(!isStatsDrawerOpen)}
                  className="ml-2 p-2 hover:bg-muted-foreground/10 rounded-full transition-colors"
                  aria-label="Show all stats"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Expandable Drawer - Group B Stats */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isStatsDrawerOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
            }`}>
                <div 
                  className="w-full bg-muted border border-border border-t-0 rounded-b-lg py-1 pl-1 pr-2"
                  style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
                >
                  <div className="flex items-center justify-between w-full">
                    {/* Group B - Hidden Stats with same spacing as top row */}
                    <div className="flex items-center justify-around flex-1 space-x-2">
                    <div className="text-center">
                      <div className="font-bold text-foreground text-lg">
                        {ratedCoursesCount}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Rated Courses
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground text-lg">
                        {averageRating > 0 ? `${averageRating}/10` : '--'}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Avg. Rating
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground text-lg">
                        {followingCount}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Following
                      </div>
                    </div>
                  </div>
                  
                  {/* Invisible spacer to match three-dot button width */}
                  <div className="ml-2 w-8 h-8"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content container - transparent to show blur behind */}
      <div className="relative w-full">
        
        {/* Activity Section - directly after stats bar */}
        <div 
          id="activity"
          className=""
          ref={activityRef}
        >
            <ProfileSectionCarousel onSectionChange={onSectionChange} />
            
            {/* Activity Posts Section - Only show when activity section is active */}
            {activeSection === 'activity' && (
              <>
                {/* Break out of container on mobile for edge-to-edge activity feed */}
                <div className="block md:hidden mt-8 -mx-4">
                  <ActivityFeed
                    userId={profile?.id || ''}
                    isOwnProfile={isOwnProfile}
                    profileDisplayName={profile?.display_name}
                  />
                </div>
                {/* Desktop version with normal container */}
                <div className="hidden md:block mt-8 px-4">
                  <ActivityFeed
                    userId={profile?.id || ''}
                    isOwnProfile={isOwnProfile}
                    profileDisplayName={profile?.display_name}
                  />
                </div>
              </>
            )}
            
            {/* Handicap Section - Only show when handicap section is active */}
            {activeSection === 'handicap' && (
              <div className="mt-8 px-0">
                <HandicapSection 
                  userId={profile?.id || ''}
                  profile={profile}
                />
              </div>
            )}
            
            {/* Top 100 Section - Only show when top100 section is active */}
            {activeSection === 'top100' && (
              <div className="mt-8 px-0">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-bold text-foreground">Top 100 courses</h2>
                  </div>
                </div>
                <LatestHighlights userId={profile?.id || ''} isOwnProfile={isOwnProfile} />
                <UserCoursesContent 
                  username={profile?.username || ''}
                  isOwnProfile={isOwnProfile}
                  displayName={profile?.display_name || 'User'}
                />
              </div>
            )}
        </div>
        
        {/* Post Viewer Modal */}
        {currentPost && (
          <PostViewerModal
            isOpen={isOpen}
            onClose={closePostViewer}
            initialPost={currentPost}
            allUserPosts={viewerPosts}
          />
        )}
        
        </div>

      {/* Rest of content sections would continue here... */}
      
      {/* Custom Edit Profile Dialog with glass effect trigger */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          
          
          <ProfileFormFields
            formData={formData}
            isUsernameSet={isUsernameSet}
            userId={user?.id || ''}
            userType={profile?.user_type}
            onInputChange={handleInputChange}
            onTextareaChange={handleTextareaChange}
            onSelectChange={handleSelectChange}
            onHandicapChange={handleHandicapChange}
            onPublicToggle={handlePublicToggle}
            onProfileUpdate={onProfileUpdate}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HeroProfileHeader;
