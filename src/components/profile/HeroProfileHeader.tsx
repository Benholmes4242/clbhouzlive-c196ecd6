import React, { useState, useEffect } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { useStaggeredInView } from '@/hooks/useInViewAnimation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProfileFormFields from "./ProfileFormFields";
import { useProfileForm } from "./hooks/useProfileForm";
import { useActivityPosts } from './hooks/useActivityPosts';
import { ActivityPost } from './types/ActivityTypes';
import ActivityHeader from './components/ActivityHeader';
import ActivityPostCard from './components/ActivityPostCard';
import PostViewerModal from '../posts/PostViewerModal';
import { usePostViewer } from '@/hooks/usePostViewer';
import { extractGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import UserCoursesContent from '@/components/courses/UserCoursesContent';
import HandicapSection from './HandicapSection';
import ProfileSectionCarousel from './ProfileSectionCarousel';
import { createDynamicBackgroundStyle } from '@/utils/backgroundGenerator';

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
  background_image_url?: string;
  cover_photo_url?: string;
  bio?: string;
  eg_handicap_index?: number;
  eg_app_connected?: boolean;
  user_type?: string;
  is_public?: boolean;
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Stats state
  const [ratedCoursesCount, setRatedCoursesCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  
  // Activity posts logic
  const { posts, loading: postsLoading, fetchUserPosts } = useActivityPosts(profile?.id);
  const { isOpen, currentPost, allUserPosts: viewerPosts, openPostViewer, closePostViewer } = usePostViewer({ source: 'profile' });
  const [selectedPost, setSelectedPost] = useState<ActivityPost | null>(null);
  
  // Fetch stats data
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
  
  // Update avatar key when profile photo URL changes to force re-render
  useEffect(() => {
    setAvatarKey(Date.now());
  }, [profile?.profile_photo_url]);


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

  return (
    <>
      {/* Dynamic Background - Auto-generated from profile photo */}
      <div className="relative w-full">
        {/* Apple Music Style Dynamic Background */}
        <div 
          className="absolute inset-0 w-full h-[600px] overflow-hidden"
          style={{
            backgroundImage: profile?.profile_photo_url 
              ? `url(${profile.profile_photo_url}?t=${avatarKey})`
              : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-foreground)) 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top', // Focus on upper portion to avoid faces
            backgroundRepeat: 'no-repeat',
            filter: 'blur(40px) saturate(1.3) brightness(0.9)', // Heavy blur to obscure details
            transform: 'scale(1.2)', // Larger scale to crop edges and hide recognizable features
          }}
        />
        
        
        {/* Profile Content */}
        <div className="relative z-10 flex flex-col items-center text-center pt-20 pb-8">
          
          {/* Edit Profile Button - Top Right for own profile */}
          {isOwnProfile && (
            <div className="absolute top-6 right-6">
              <button 
                className="bg-black/25 backdrop-blur-md shadow-xl rounded-full py-2 px-4 text-white text-sm font-medium hover:bg-black/35 transition-colors"
                onClick={() => setEditDialogOpen(true)}
              >
                Edit Profile
              </button>
            </div>
          )}
          
          {/* Large Centered Profile Photo */}
          <div className="w-40 h-40 mb-6">
            {isOwnProfile ? (
              <div 
                className="relative cursor-pointer group"
                onClick={() => {
                  if (uploading) return;
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      console.log('Photo selected for upload:', file);
                      handlePhotoUpload(file);
                    }
                  };
                  input.click();
                }}
              >
                <OptimizedAvatar
                  key={avatarKey}
                  src={profile?.profile_photo_url ? `${profile.profile_photo_url}?t=${avatarKey}` : undefined}
                  alt={displayName}
                  size={160}
                  fallback={displayName.charAt(0)}
                  className="shadow-2xl group-hover:opacity-80 transition-opacity ring-4 ring-white/30"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <span className="text-white text-sm font-medium">Edit Photo</span>
                </div>
              </div>
            ) : (
              <OptimizedAvatar
                key={avatarKey}
                src={profile?.profile_photo_url ? `${profile.profile_photo_url}?t=${avatarKey}` : undefined}
                alt={displayName}
                size={160}
                fallback={displayName.charAt(0)}
                className="shadow-2xl ring-4 ring-white/30"
              />
            )}
          </div>
          
          {/* Centered User Information */}
          <div className="text-center mb-6">
            {/* User's Name */}
            <h1 className="text-4xl font-bold mb-2 text-white">
              {displayName}
            </h1>
            
            {/* Username */}
            {username && (
              <p className="text-lg text-white/80 mb-2">
                @{username}
              </p>
            )}
            
            {/* Home Golf Club */}
            <p className="text-base text-white/70">
              {homeClub}
            </p>
          </div>

          {/* Thinner Stats Bar */}
          <div className="w-full max-w-md">
            <div className="bg-black/25 backdrop-blur-md shadow-xl rounded-full py-2">
              <div className="flex items-center justify-around w-full px-6 space-x-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {profile?.eg_handicap_index ? profile.eg_handicap_index.toFixed(1) : '--'}
                  </div>
                  <div className="text-xs text-white/70">Handicap</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{postsCount}</div>
                  <div className="text-xs text-white/70">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{ratedCoursesCount}</div>
                  <div className="text-xs text-white/70">Rated Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {averageRating > 0 ? `${averageRating}/10` : '--'}
                  </div>
                  <div className="text-xs text-white/70">Avg. Rating</div>
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
              <div className="mt-8 px-0">
                <ActivityHeader 
                  postsCount={posts.length}
                  isOwnProfile={isOwnProfile}
                  onPostCreated={fetchUserPosts}
                />

                {/* Loading state */}
                {postsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading posts...</p>
                  </div>
                ) : (
                  <>
                    {/* Grid layout for square posts */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {posts.map((post, index) => {
                        // Check if this is the first video post
                        const isFirstVideo = index === 0 && post.post_media?.[0]?.media_type === 'video';
                         
                         return (
                          <ActivityPostCard
                            key={post.id}
                            post={post}
                            attributionText={isOwnProfile ? "You posted this" : `${profile?.display_name?.split(' ')[0] || 'User'} posted this`}
                            isFirstVideo={isFirstVideo}
                            onClick={(post) => {
                              // Transform and open post viewer
                              const extractGolfCourse = (postTags: any[], content: string | null) => {
                                const golfCourseTag = postTags?.find(tag => 
                                  tag.tagged_entity?.entity_type === 'golf_club' || tag.entity_type === 'golf_club'
                                );
                                
                                if (golfCourseTag) {
                                  if (golfCourseTag.entity_type === 'golf_club') {
                                    return {
                                      id: golfCourseTag.entity_id,
                                      name: golfCourseTag.name,
                                      country: '',
                                      region: ''
                                    };
                                  } else if (golfCourseTag.tagged_entity) {
                                    return {
                                      id: golfCourseTag.tagged_entity.entity_id,
                                      name: golfCourseTag.tagged_entity.name,
                                      country: '',
                                      region: ''
                                    };
                                  }
                                }
                                
                                const courseFromContent = extractGolfCourseFromContent(content);
                                if (courseFromContent) {
                                  return courseFromContent;
                                }
                                
                                return undefined;
                              };

                              const transformedPost = {
                                id: post.id,
                                content: post.content,
                                created_at: post.created_at,
                                user: post.user,
                                post_media: post.post_media || [],
                                post_tags: post.post_tags || [],
                                golfCourse: extractGolfCourse(post.post_tags || [], post.content)
                              };
                              
                              const transformedPosts = posts.map(p => ({
                                id: p.id,
                                content: p.content,
                                created_at: p.created_at,
                                user: p.user,
                                post_media: p.post_media || [],
                                post_tags: p.post_tags || [],
                                golfCourse: extractGolfCourse(p.post_tags || [], p.content)
                              }));
                              
                              openPostViewer(transformedPost, transformedPosts);
                            }}
                          />
                        );
                      })}
                    </div>

                    {posts.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No posts yet.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {/* Handicap Section - Only show when handicap section is active */}
            {activeSection === 'handicap' && (
              <div className="mt-8 px-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold text-white">Handicap & Rounds</h2>
                </div>
                <div className="bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg p-6" style={{ borderRadius: '8px' }}>
                  <HandicapSection 
                    userId={profile?.id || ''}
                    profile={profile}
                  />
                </div>
              </div>
            )}
            
            {/* Top 100 Section - Only show when top100 section is active */}
            {activeSection === 'top100' && (
              <div className="mt-8 px-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold text-white">Top 100 courses</h2>
                </div>
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
        <DialogContent className="sm:max-w-[425px]">
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HeroProfileHeader;
