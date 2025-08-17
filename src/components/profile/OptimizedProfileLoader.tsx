import React, { Suspense } from 'react';
import { useOptimizedProfileData } from '@/hooks/useOptimizedProfileData';
import { ProfileHeaderSkeleton, ProfileTabsSkeleton } from './ProfileSkeleton';
import CinematicProfileHeader from './CinematicProfileHeader';
import { useCloudflareStream } from '@/hooks/useCloudflareStream';
import { useR2Upload } from '@/hooks/useR2Upload';
import ProfileStatsBar from './ProfileStatsBar';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface OptimizedProfileLoaderProps {
  userId: string;
  isOwnProfile: boolean;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const OptimizedProfileLoader: React.FC<OptimizedProfileLoaderProps> = ({
  userId,
  isOwnProfile,
  activeSection = 'activity',
  onSectionChange
}) => {
  const { data, isLoading, error } = useOptimizedProfileData(userId);
  const { uploadVideo, uploading: videoUploading } = useCloudflareStream();
  const { uploadImage, uploading: photoUploading } = useR2Upload();

  const handleVideoUpload = async (file: File) => {
    try {
      const result = await uploadVideo(file);
      if (result?.success && result.videoUrl) {
        // Update profile with video URL
        // This will trigger a refetch of the optimized data
      }
    } catch (error) {
      console.error('Video upload failed:', error);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      const result = await uploadImage(file);
      if (result?.success && result.imageUrl) {
        // Update profile with photo URL
        // This will trigger a refetch of the optimized data
      }
    } catch (error) {
      console.error('Photo upload failed:', error);
    }
  };

  const handleVideoRemove = async () => {
    // Remove video from profile
    // This will trigger a refetch of the optimized data
  };

  if (isLoading) {
    return <ProfileHeaderSkeleton />;
  }

  if (error || !data?.profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }

  const { profile } = data;
  const displayName = profile?.display_name || 'User';
  const username = profile?.username;

  return (
    <>
      {/* Cinematic Profile Header */}
      <div className="relative w-full bg-background">
        <CinematicProfileHeader
          userId={profile?.id || ''}
          displayName={displayName}
          isOwnProfile={isOwnProfile}
          
        />
        
        {/* Profile Info and Stats Bar - Positioned over the blurred area */}
        <div className="absolute bottom-[-16rem] left-0 right-0 z-50 flex flex-col items-center text-center pb-8 px-4 pt-16">
          {/* User Information */}
          <div className="text-center mb-6">
            {/* User's Name */}
            <div className="flex items-center justify-center">
              <h1 className="text-4xl md:text-5xl text-black font-bold">
                {displayName}
              </h1>
            </div>
            
            {/* Username with Edit Button */}
            {username && (
              <div className="flex items-center justify-center gap-3 mb-2">
                <p className="text-lg md:text-xl text-black">
                  @{username}
                </p>
                
                {/* Edit Profile Button - Next to username for own profile */}
                {isOwnProfile && (
                  <button 
                    className="px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted border border-border text-foreground font-medium transition-all duration-300 ease-in-out flex items-center justify-center text-sm" 
                    onClick={() => {/* Open edit dialog */}}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            )}

            {/* Home Golf Club */}
            <p className="text-lg md:text-xl text-black mb-4">
              {profile?.home_club || ''}
            </p>
          </div>

          {/* Stats Carousel - Using optimized data */}
          <div className="flex items-center justify-center gap-4 w-full">
            {/* Left Navigation Arrow */}
            <div className="flex-shrink-0">
              <button
                onClick={() => {
                  const container = document.getElementById('stats-container');
                  if (container) {
                    container.scrollBy({ left: -320, behavior: 'smooth' });
                  }
                }}
                className="w-6 h-6 rounded-full bg-muted/50 hover:bg-muted border border-border flex items-center justify-center text-foreground opacity-80 hover:opacity-100 transition-all duration-200 p-1"
              >
                <ArrowLeftIcon className="w-3 h-3" />
              </button>
            </div>
            
            {/* Stats Container - Mobile shows 3.5 stats, Desktop shows 4 */}
            <div className="flex-shrink-0 overflow-hidden rounded-lg w-full md:w-[520px]">
              <div 
                id="stats-container"
                className="flex gap-6 md:gap-16 overflow-x-auto scrollbar-hide px-2 py-2"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <div className="flex-shrink-0 text-center w-20">
                  <div className="text-4xl md:text-5xl text-foreground">
                    {profile?.eg_handicap_index ? profile.eg_handicap_index.toFixed(1) : '--'}
                  </div>
                  <div className="text-base text-muted-foreground">Handicap</div>
                </div>
                
                <div className="flex-shrink-0 text-center w-20">
                  <div className="text-4xl md:text-5xl text-foreground">
                    {data.coursesPlayed}
                  </div>
                  <div className="text-base text-muted-foreground">Played</div>
                </div>
                
                <div className="flex-shrink-0 text-center w-20">
                  <div className="text-4xl md:text-5xl text-foreground">
                    {data.coursesRated}
                  </div>
                  <div className="text-base text-muted-foreground">Rated</div>
                </div>
                
                <div className="flex-shrink-0 text-center w-20">
                  <div className="text-4xl md:text-5xl text-foreground">
                    {data.averageRating ? data.averageRating.toFixed(1) : '--'}
                  </div>
                  <div className="text-base text-muted-foreground">Avg Rating</div>
                </div>
                
                <div className="flex-shrink-0 text-center w-20">
                  <div className="text-4xl md:text-5xl text-foreground">
                    {data.followersCount}
                  </div>
                  <div className="text-base text-muted-foreground">Followers</div>
                </div>
                
                <div className="flex-shrink-0 text-center w-20">
                  <div className="text-4xl md:text-5xl text-foreground">
                    {data.followingCount}
                  </div>
                  <div className="text-base text-muted-foreground">Following</div>
                </div>
              </div>
            </div>
            
            {/* Right Navigation Arrow */}
            <div className="flex-shrink-0">
              <button
                onClick={() => {
                  const container = document.getElementById('stats-container');
                  if (container) {
                    container.scrollBy({ left: 320, behavior: 'smooth' });
                  }
                }}
                className="w-6 h-6 rounded-full bg-muted/50 hover:bg-muted border border-border flex items-center justify-center text-foreground opacity-80 hover:opacity-100 transition-all duration-200 p-1"
              >
                <ArrowRightIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OptimizedProfileLoader;