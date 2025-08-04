import React, { useState } from 'react';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import ProfileVideoPlayer from './ProfileVideoPlayer';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

interface ProfileVideoDisplayProps {
  videoUrl: string;
  fallbackPhotoUrl?: string;
  displayName: string;
  isOwnProfile: boolean;
  uploading: boolean;
  onEditClick: () => void;
  onPhotoUpload: (file: File) => void;
  onVideoUpload: () => void;
}

const ProfileVideoDisplay: React.FC<ProfileVideoDisplayProps> = ({
  videoUrl,
  fallbackPhotoUrl,
  displayName,
  isOwnProfile,
  uploading,
  onEditClick,
  onPhotoUpload,
  onVideoUpload
}) => {
  const [videoEnded, setVideoEnded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const handleVideoEnd = () => {
    setVideoEnded(true);
    setShowFallback(true);
  };

  const handleReplayVideo = () => {
    setVideoEnded(false);
    setShowFallback(false);
  };

  // Swipe gesture for video replay
  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => {
      if (videoEnded || showFallback) {
        handleReplayVideo();
      }
    },
    threshold: 50
  });

  const handleClick = () => {
    if (isOwnProfile && !uploading) {
      if (videoEnded) {
        // If video ended, allow photo upload or profile edit
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            onPhotoUpload(file);
          }
        };
        input.click();
      } else {
        // If video is playing/paused, open edit profile
        onEditClick();
      }
    }
  };

  return (
    <div 
      ref={swipeRef}
      className={`relative w-full h-full ${isOwnProfile ? 'group' : ''}`}
    >
      {showFallback && fallbackPhotoUrl ? (
        <OptimizedAvatar
          src={fallbackPhotoUrl}
          alt={displayName}
          size={256}
          fallback={displayName.charAt(0)}
          className="shadow-2xl w-full h-full"
          priority={true}
        />
      ) : (
        <ProfileVideoPlayer
          videoUrl={videoUrl}
          className="w-full h-full shadow-2xl"
          onVideoEnd={handleVideoEnd}
          autoPlay={true}
        />
      )}

      {/* Edit buttons overlay for own profile */}
      {isOwnProfile && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
          <div className="flex flex-col gap-2">
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
                    onPhotoUpload(file);
                  }
                };
                input.click();
              }}
              className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-3 py-1.5 text-white text-sm font-medium hover:bg-white/30 transition-all duration-200"
              disabled={uploading}
            >
              📷 Edit Photo
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVideoUpload();
              }}
              className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-3 py-1.5 text-white text-sm font-medium hover:bg-white/30 transition-all duration-200"
              disabled={uploading}
            >
              🎥 Edit Video
            </button>
          </div>
        </div>
      )}

      {/* Uploading state */}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span className="bg-white/80 text-green-900 text-xs px-3 py-1 rounded-full font-medium shadow">
              Uploading...
            </span>
          </div>
        </div>
      )}
    </div>
  );

export default ProfileVideoDisplay;