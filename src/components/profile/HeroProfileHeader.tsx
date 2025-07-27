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
  onProfileUpdate: () => void;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const HeroProfileHeader = ({ 
  profile, 
  onProfileUpdate,
  activeSection = 'activity',
  onSectionChange
}: HeroProfileHeaderProps) => {
  const { user } = useSupabaseSession();
  const [uploading, setUploading] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now()); // Add cache-busting key
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  
  // Activity posts logic
  const { posts, loading: postsLoading, fetchUserPosts } = useActivityPosts(profile?.id);
  const { isOpen, currentPost, allUserPosts: viewerPosts, openPostViewer, closePostViewer } = usePostViewer({ source: 'profile' });
  const [selectedPost, setSelectedPost] = useState<ActivityPost | null>(null);
  
  // Derived values
  const isOwnProfile = user?.id === profile?.id;
  const displayName = profile?.display_name || 'User';
  const username = profile?.username;
  const homeClub = profile?.home_club || 'No Club';
  const backgroundImage = profile?.cover_photo_url;
  const postsCount = 0; // This would be fetched from actual data
  
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

  console.log('HeroProfileHeader - profile cover_photo_url:', profile?.cover_photo_url);
  console.log('HeroProfileHeader - backgroundImage:', backgroundImage);

  return (
    <>
      {/* Cover photo background - extends to absolute top */}
      <div 
        className="fixed top-0 left-0 right-0 w-full h-screen bg-gradient-to-br from-primary to-primary/80 overflow-hidden z-0"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      </div>
      
      {/* Content container - positioned above the background */}
      <div className="relative w-full min-h-screen z-10">
        {/* Content Container - Top Section - conditional padding based on cover photo */}
        <div className={`relative flex items-end justify-between px-8 pb-12 ${
          backgroundImage ? 'pt-48' : 'pt-52'
        }`}>
          
          {/* Left Side - Profile Information */}
          <div className="flex flex-col text-white">
            {/* Profile Photo */}
            <div className="w-24 h-24 mb-4">
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
                    size={96}
                    fallback={displayName.charAt(0)}
                    className="shadow-lg group-hover:opacity-80 transition-opacity"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <span className="text-white text-xs font-medium">Edit</span>
                  </div>
                </div>
              ) : (
                <OptimizedAvatar
                  key={avatarKey}
                  src={profile?.profile_photo_url ? `${profile.profile_photo_url}?t=${avatarKey}` : undefined}
                  alt={displayName}
                  size={96}
                  fallback={displayName.charAt(0)}
                  className="shadow-lg"
                />
              )}
            </div>
            
            {/* User's Name */}
            <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">
              {displayName}
            </h1>
            
            {/* Username */}
            {username && (
              <p className="text-xl text-white/90 mb-2 drop-shadow">
                @{username}
              </p>
            )}
            
            {/* Home Golf Club - aligned with Change Cover Photo button */}
            <p className="text-lg text-white/80 drop-shadow">
              {homeClub}
            </p>
          </div>
          
          {/* Right Side - Action Buttons (only for own profile) */}
          {isOwnProfile && (
            <div className="flex flex-col space-y-2 items-end justify-end">
              <button 
                className="bg-transparent backdrop-blur-[1px] border border-white/25 text-white px-3 py-1.5 shadow-lg shadow-black/10 transition-colors text-base font-medium"
                style={{ borderRadius: '8px' }}
                onClick={() => setEditDialogOpen(true)}
              >
                Edit Profile
              </button>
              <button 
                className="bg-transparent backdrop-blur-[1px] border border-white/25 text-white px-3 py-1.5 shadow-lg shadow-black/10 transition-colors text-base font-medium"
                style={{ borderRadius: '8px' }}
                onClick={async () => {
                  // Handle cover photo upload
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file && user) {
                      try {
                        setUploading(true);
                        const fileExt = file.name.split('.').pop();
                        const fileName = `cover_${Date.now()}.${fileExt}`;
                        const filePath = `${user.id}/${fileName}`;

                        // Upload to Supabase storage
                        const { error: uploadError } = await supabase.storage
                          .from('profile-backgrounds')
                          .upload(filePath, file);

                        if (uploadError) {
                          console.error('Error uploading cover image:', uploadError);
                          toast({
                            title: "Upload Failed",
                            description: "Failed to upload cover photo",
                            variant: "destructive",
                          });
                          return;
                        }

                        // Get public URL
                        const { data } = supabase.storage
                          .from('profile-backgrounds')
                          .getPublicUrl(filePath);

                        const publicUrl = data.publicUrl;

                        // Update user profile with new cover photo URL
                        const { error: updateError } = await supabase
                          .from('user_profiles')
                          .update({ cover_photo_url: publicUrl })
                          .eq('id', user.id);

                        if (updateError) {
                          console.error('Error updating profile:', updateError);
                          toast({
                            title: "Update Failed",
                            description: "Failed to update cover photo",
                            variant: "destructive",
                          });
                          return;
                        }

                        // Refresh the profile data
                        onProfileUpdate();
                        
                        toast({
                          title: "Success",
                          description: "Cover photo updated successfully!",
                          variant: "default",
                        });
                      } catch (error) {
                        console.error('Error uploading cover image:', error);
                        toast({
                          title: "Upload Failed",
                          description: "Failed to upload cover photo",
                          variant: "destructive",
                        });
                      } finally {
                        setUploading(false);
                      }
                    }
                  };
                  input.click();
                }}
              >
                Change Cover Photo
              </button>
            </div>
          )}
        </div>

        {/* Stats Bar - Full Width with equal padding */}
        <div className="relative px-8 mb-6">
          <div className="bg-black/40 backdrop-blur-sm px-6 py-1 shadow-lg" style={{ borderRadius: '8px' }}>
            <div className="flex items-center justify-between w-full text-white">
              <div className="text-center">
                <div className="font-bold text-lg drop-shadow">4.0</div>
                <div className="text-xs text-white/80 drop-shadow">Handicap</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg drop-shadow">{postsCount}</div>
                <div className="text-xs text-white/80 drop-shadow">Posts</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg drop-shadow">32</div>
                <div className="text-xs text-white/80 drop-shadow">Rated Courses</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg drop-shadow">8.6/10</div>
                <div className="text-xs text-white/80 drop-shadow">Avg. Rating</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Activity Section - directly after stats bar */}
        <div 
          id="activity"
          className="px-8 pb-8"
          ref={activityRef}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Activity Card */}
            <div 
              className="relative overflow-hidden flex flex-col justify-end text-white h-[200px] cursor-pointer group"
              style={{ borderRadius: '8px' }}
              ref={null}
              onClick={() => onSectionChange?.('activity')}
            >
              {/* Golf Course Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url('/lovable-uploads/2a145957-bebc-43ef-bd85-1f1343e05210.png')`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              
              {/* Content */}
              <div className="relative p-8 cursor-pointer group">
                <div className="flex items-center mb-3">
                  <h3 className="text-3xl font-bold">Activity</h3>
                </div>
                <p className="text-white/90 text-lg leading-relaxed drop-shadow-lg">View your recent golf moments, rounds played, and course discoveries.</p>
              </div>
            </div>

            {/* Handicap Card */}
            <div 
              className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 flex flex-col justify-end text-white h-[200px] cursor-pointer group"
              style={{ borderRadius: '8px' }}
              ref={null}
              onClick={() => onSectionChange?.('handicap')}
            >
              {/* Handicap Pattern Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.1) 0deg, transparent 60deg, rgba(255,255,255,0.1) 120deg, transparent 180deg, rgba(255,255,255,0.1) 240deg, transparent 300deg),
                    radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)
                  `,
                  backgroundSize: '80px 80px, 100% 100%'
                }}>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              
              {/* Content */}
              <div className="relative p-8 cursor-pointer group">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/>
                      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
                      <path d="M12 2v2"/>
                      <path d="M12 20v2"/>
                      <path d="M4.93 4.93l1.41 1.41"/>
                      <path d="M17.66 17.66l1.41 1.41"/>
                      <path d="M2 12h2"/>
                      <path d="M20 12h2"/>
                      <path d="M6.34 17.66l-1.41 1.41"/>
                      <path d="M19.07 4.93l-1.41 1.41"/>
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold group-hover:scale-105 transition-transform">Handicap</h3>
                </div>
                <p className="text-white/80 text-lg leading-relaxed">Track your progress and handicap development over time.</p>
              </div>
            </div>

            {/* Top 100 Courses Card */}
            <div 
              className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col justify-end text-white h-[200px] cursor-pointer group"
              style={{ borderRadius: '8px' }}
              ref={null}
              onClick={() => onSectionChange?.('top100')}
            >
              {/* Golf Course Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url('/lovable-uploads/b5c44b64-e08d-4c79-b3d0-e15cad97b1b3.png')`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              
              {/* Content */}
              <div className="relative p-8 cursor-pointer group">
                <div className="flex items-center mb-3">
                  <h3 className="text-3xl font-bold">Top 100</h3>
                </div>
                <p className="text-white/90 text-lg leading-relaxed drop-shadow-lg">Discover and track the world's greatest golf courses.</p>
              </div>
            </div>
            </div>
            
            {/* Activity Posts Section - Only show when activity section is active */}
            {activeSection === 'activity' && (
              <div className="mt-8 px-2">
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
