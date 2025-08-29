import React from 'react';
import CinematicProfileHeader from '../CinematicProfileHeader';
import ResponsiveGlassCard from '../ResponsiveGlassCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserProfile {
  id: string;
  display_name?: string;
  username?: string;
  home_club?: string;
  profile_photo_url?: string;
  header_photo_url?: string;
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
  mobile_crop_x?: number;
  mobile_crop_y?: number;
  mobile_crop_width?: number;
  mobile_crop_height?: number;
  desktop_crop_x?: number;
  desktop_crop_y?: number;
  desktop_crop_width?: number;
  desktop_crop_height?: number;
}

interface ProfileVisualHeaderProps {
  profile: UserProfile | null;
  isOwnProfile: boolean;
  profileCardRef: any;
  hasImmersiveMedia: boolean;
  onPreviewImmersive: () => void;
  onEditProfile: () => void;
  onMediaManager: () => void;
}

const ProfileVisualHeader: React.FC<ProfileVisualHeaderProps> = ({
  profile,
  isOwnProfile,
  profileCardRef,
  hasImmersiveMedia,
  onPreviewImmersive,
  onEditProfile,
  onMediaManager
}) => {
  const isMobile = useIsMobile();

  return (
    <>
      {/* Cinematic Header */}
      <CinematicProfileHeader
        videoUrl={profile?.profile_video_url}
        thumbnailUrl={profile?.profile_video_thumbnail_url}
        profilePhotoUrl={profile?.profile_photo_url}
        displayName={profile?.display_name || profile?.username || 'User'}
        isOwnProfile={isOwnProfile}
        onPhotoUpload={() => {}} // Will be handled by parent
        uploading={false}
        hasImmersiveMedia={hasImmersiveMedia}
        onOpenMediaManager={onMediaManager}
        onPreviewImmersive={onPreviewImmersive}
      />
      
      {/* Profile Card */}
      <div 
        ref={profileCardRef}
        className={`
          ${isMobile 
            ? '-mt-24 mb-6 px-6' 
            : '-mt-32 mb-8 px-8 max-w-4xl mx-auto'
          }
          relative z-20
        `}
      >
        <ResponsiveGlassCard
          profile={profile}
          isOwnProfile={isOwnProfile}
          hasImmersiveMedia={hasImmersiveMedia}
          onPreviewImmersive={onPreviewImmersive}
          onEditProfile={onEditProfile}
          onMediaManager={onMediaManager}
        />
      </div>
    </>
  );
};

export default ProfileVisualHeader;