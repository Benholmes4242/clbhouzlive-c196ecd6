import React, { useState, useEffect } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
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
import { Swords } from 'lucide-react';
import ProfileVideoDisplay from './ProfileVideoDisplay';
import ProfileVideoUpload from './ProfileVideoUpload';

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
  profile_video_visibility?: string;
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
  const [uploading, setUploading] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now()); // Add cache-busting key
  const [imageLoading, setImageLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Stats state
  const [ratedCoursesCount, setRatedCoursesCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
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

  // Update avatar key when profile photo URL changes to force re-render
  useEffect(() => {
    setAvatarKey(Date.now());
  }, [profile?.profile_photo_url]);

  // Achievement ring calculation
  const getAchievementRing = (coursesPlayed: number): AchievementRing => {
    if (coursesPlayed >= 300) {
      return { level: 5, title: "🌈 Course Collector", ringClass: "ring-gradient", color: "gradient", courses: 300 };
    } else if (coursesPlayed >= 200) {
      return { level: 4, title: "🟢 Clubhouse Elite", ringClass: "ring-green", color: "#32CD32", courses: 200 };
    } else if (coursesPlayed >= 100) {
      return { level: 3, title: "💙 Century Club", ringClass: "ring-blue", color: "#1E90FF", courses: 100 };
    } else if (coursesPlayed >= 50) {
      return { level: 2, title: "🥈 The Turn", ringClass: "ring-silver", color: "#C0C0C0", courses: 50 };
    } else if (coursesPlayed >= 20) {
      return { level: 1, title: "🟡 Rookie", ringClass: "ring-gold", color: "#FFD700", courses: 20 };
    } else {
      return { level: 0, title: "", ringClass: "ring-none", color: "transparent", courses: 0 };
    }
  };

  const achievementRing = getAchievementRing(userProgressData.coursesPlayed);


  const handlePhotoUpload = async (file: File) => {
    if (!user || uploading) return;

    console.log('Starting photo upload process:', file);
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading to storage path:', filePath);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('Public URL generated:', publicUrl);

      // Update user profile with new photo URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          profile_photo_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      console.log('Profile updated successfully');

      // Force avatar to refresh by updating the key
      setAvatarKey(Date.now());
      
      console.log('Photo upload successful, refreshing profile data...');
      
      // Refresh the profile data
      onProfileUpdate();
      
      toast({
        title: "Success", 
        description: "Profile photo updated successfully!",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Photo upload error:', error);
      toast({
        title: "Upload Failed", 
        description: "Failed to upload photo: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (videoUrl: string, thumbnailUrl: string) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          profile_video_url: videoUrl,
          profile_video_thumbnail_url: thumbnailUrl,
          has_profile_video: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile video update error:', updateError);
        throw updateError;
      }

      // Refresh the profile data
      onProfileUpdate();
      
    } catch (error) {
      console.error('Profile video update error:', error);
      toast({
        title: "Update Failed", 
        description: "Failed to update profile video: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleVideoRemove = async () => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          profile_video_url: null,
          profile_video_thumbnail_url: null,
          has_profile_video: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile video remove error:', updateError);
        throw updateError;
      }

      // Refresh the profile data
      onProfileUpdate();
      
    } catch (error) {
      console.error('Profile video remove error:', error);
      toast({
        title: "Remove Failed", 
        description: "Failed to remove profile video: " + (error as Error).message,
        variant: "destructive",
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
      <div className="relative w-full">
        {/* Apple Music Style Dynamic Background */}
        <div 
          className="absolute inset-0 w-full overflow-hidden transition-all duration-500"
          style={{
            height: getBackgroundHeight(),
            backgroundImage: profile?.profile_photo_url 
              ? `url(${getOptimizedImageUrl(profile.profile_photo_url, 800, 600, 75)})`
              : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-foreground)) 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top', // Focus on upper portion to avoid faces
            backgroundRepeat: 'no-repeat',
            filter: 'blur(40px) saturate(1.3) brightness(0.9)', // Heavy blur to obscure details
            transform: 'scale(1.2)', // Larger scale to crop edges and hide recognizable features
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0.8) 80%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0.8) 80%, rgba(0,0,0,0) 100%)',
          }}
        />
        
        
        {/* Profile Content */}
        <div className="relative z-10 flex flex-col items-center text-center pt-20 pb-8">
          
          

          {/* Profile Photo/Video */}
          <div className="w-64 h-64 mb-6">
            <div 
              className={`relative rounded-full transition-all duration-300 ${
                achievementRing.ringClass === 'ring-gold' ? 'ring-[5px] ring-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.3)]' :
                achievementRing.ringClass === 'ring-silver' ? 'ring-[5px] ring-gray-400 shadow-[0_0_20px_rgba(192,192,192,0.3)]' :
                achievementRing.ringClass === 'ring-blue' ? 'ring-[5px] ring-blue-400 shadow-[0_0_20px_rgba(30,144,255,0.3)]' :
                achievementRing.ringClass === 'ring-green' ? 'ring-[5px] ring-green-400 shadow-[0_0_20px_rgba(50,205,50,0.3)]' :
                achievementRing.ringClass === 'ring-gradient' ? 'ring-[5px] ring-transparent bg-gradient-to-r from-yellow-400 to-green-400 shadow-[0_0_25px_rgba(255,215,0,0.4)]' :
                ''
              } w-full h-full`}
              title={achievementRing.title}
            >
              <div className={`w-full h-full rounded-full overflow-hidden ${achievementRing.ringClass === 'ring-gradient' ? 'bg-white p-[5px]' : ''}`}>
              {profile?.has_profile_video && profile?.profile_video_url ? (
                <ProfileVideoDisplay
                  videoUrl={profile.profile_video_url}
                  fallbackPhotoUrl={profile.profile_photo_url}
                  displayName={displayName}
                  isOwnProfile={isOwnProfile}
                  uploading={uploading}
                  onEditClick={() => setEditDialogOpen(true)}
                  onPhotoUpload={handlePhotoUpload}
                  onVideoUpload={() => setEditDialogOpen(true)}
                  achievementRing={achievementRing}
                />
              ) : isOwnProfile ? (
                <div className="relative w-full h-full group">
                  <OptimizedAvatar
                    key={avatarKey}
                    src={profile?.profile_photo_url ? `${profile.profile_photo_url}?t=${avatarKey}` : undefined}
                    alt={displayName}
                    size={256}
                    fallback={displayName.charAt(0)}
                    className="shadow-2xl w-full h-full"
                    priority={true}
                  />
                  {/* Edit buttons overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
                    <div className="flex flex-col gap-3 items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (uploading) return;
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              handlePhotoUpload(file);
                            }
                          };
                          input.click();
                        }}
                        className="bg-white/5 backdrop-blur-2xl border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.2)] rounded-lg text-white font-medium hover:bg-white/10 transition-all duration-300 ease-in-out px-4 py-2 text-sm"
                        style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
                        disabled={uploading}
                      >
                        📷 Edit Photo
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditDialogOpen(true);
                        }}
                        className="bg-white/5 backdrop-blur-2xl border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.2)] rounded-lg text-white font-medium hover:bg-white/10 transition-all duration-300 ease-in-out px-4 py-2 text-sm"
                        style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
                        disabled={uploading}
                      >
                        🎥 Add Video
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <OptimizedAvatar
                  key={avatarKey}
                  src={profile?.profile_photo_url ? `${profile.profile_photo_url}?t=${avatarKey}` : undefined}
                  alt={displayName}
                  size={256}
                  fallback={displayName.charAt(0)}
                  className="shadow-2xl w-full h-full"
                  priority={true}
                />
              )}
              </div>
            </div>
          </div>
          
          {/* User Information */}
          <div className="text-center mb-6">
            {/* User's Name with Edit Button */}
            <div className="flex items-center justify-center gap-3">
              <h1 className="font-bold text-white text-4xl">
                {displayName}
              </h1>
              
              {/* Edit Profile Button - Next to name for own profile */}
              {isOwnProfile && (
                <button 
                  className="bg-white/5 backdrop-blur-2xl border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.2)] rounded-full text-white font-medium hover:bg-white/10 transition-all duration-300 ease-in-out flex items-center justify-center py-1.5 px-3 text-xs pt-2 pb-1" 
                  style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
                  onClick={() => setEditDialogOpen(true)}
                >
                  Edit Profile
                </button>
              )}
            </div>
            
            {/* Username */}
            {username && (
              <p className="text-lg text-white mb-2">
                @{username}
              </p>
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
            <p className="text-base text-white">
              {homeClub}
            </p>

            {/* Compare Progress Button for other profiles */}
            {!isOwnProfile && user && (
              <div className="mt-4">
                <button
                  onClick={() => setIsCompareModalOpen(true)}
                  className="bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.2)] rounded-lg text-white font-medium hover:bg-white/15 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 py-2 px-4 text-sm"
                  style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
                >
                  <Swords className="w-4 h-4" />
                  ⚔️ Compare Golf Journey
                </button>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div 
            className="w-full bg-white/5 backdrop-blur-2xl border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.2)] rounded-lg max-w-md py-1" 
            style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
          >
            <div className="flex items-center justify-around w-full px-4 space-x-2">
              <div className="text-center">
                <div className="font-bold text-white text-lg">
                  {profile?.eg_handicap_index ? profile.eg_handicap_index.toFixed(1) : '--'}
                </div>
                <div className="text-white/70 text-xs">
                  Handicap
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-white text-lg">
                  {postsCount}
                </div>
                <div className="text-white/70 text-xs">
                  Posts
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-white text-lg">
                  {ratedCoursesCount}
                </div>
                <div className="text-white/70 text-xs">
                  Rated Courses
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-white text-lg">
                  {averageRating > 0 ? `${averageRating}/10` : '--'}
                </div>
                <div className="text-white/70 text-xs">
                  Avg. Rating
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-white text-lg">
                  {followersCount}
                </div>
                <div className="text-white/70 text-xs">
                  Followers
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-white text-lg">
                  {followingCount}
                </div>
                <div className="text-white/70 text-xs">
                  Following
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
                    <h2 className="text-3xl font-bold text-white">Top 100 courses</h2>
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
          
          {/* Profile Video Upload Section */}
          <div className="border-b pb-4 mb-4">
            <ProfileVideoUpload
              currentVideoUrl={profile?.profile_video_url}
              currentThumbnailUrl={profile?.profile_video_thumbnail_url}
              onVideoUpload={handleVideoUpload}
              onVideoRemove={handleVideoRemove}
              disabled={saving}
            />
          </div>
          
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
