import React from 'react';
import { Camera } from 'lucide-react';
import { getMobileCropPosition } from '@/utils/mobileCropUtils';

interface ProfileHeroShellProps {
  headerPhotoUrl?: string | null;
  profilePhotoUrl?: string | null;
  displayName?: string;
  updatedAt?: string;
  isOwnProfile: boolean;
  isMobile: boolean;
  // Desktop crop settings
  desktopCropX?: number;
  desktopCropY?: number;
  desktopCropWidth?: number;
  desktopCropHeight?: number;
  // Mobile crop settings
  mobileCropX?: number;
  mobileCropY?: number;
  mobileCropWidth?: number;
  mobileCropHeight?: number;
}

/**
 * ProfileHeroShell - Handles the hero image section with gradient overlay
 * Supports both mobile and desktop layouts with proper crop positioning
 */
const ProfileHeroShell: React.FC<ProfileHeroShellProps> = ({
  headerPhotoUrl,
  profilePhotoUrl,
  displayName,
  updatedAt,
  isOwnProfile,
  isMobile,
  desktopCropX = 0,
  desktopCropY = 0,
  desktopCropWidth = 100,
  desktopCropHeight = 100,
  mobileCropX,
  mobileCropY,
  mobileCropWidth,
  mobileCropHeight
}) => {
  const heroSrc = headerPhotoUrl || profilePhotoUrl || '';
  const ver = updatedAt ? new Date(updatedAt).getTime() : 0;
  const imageSrc = heroSrc ? `${heroSrc}${heroSrc.includes('?') ? '&' : '?'}v=${ver}` : '';
  
  const hasImage = Boolean(headerPhotoUrl || profilePhotoUrl);

  // Desktop crop position calculation
  const getDesktopCropPosition = () => {
    const crop = {
      x: desktopCropX,
      y: desktopCropY,
      width: desktopCropWidth,
      height: desktopCropHeight
    };
    const cx = crop.x + crop.width / 2;
    const cy = crop.y + crop.height / 2;
    return `${cx}% ${cy}%`;
  };

  // Mobile crop position using utility
  const getMobileCrop = () => {
    return getMobileCropPosition({
      mobile_crop_x: mobileCropX,
      mobile_crop_y: mobileCropY,
      mobile_crop_width: mobileCropWidth,
      mobile_crop_height: mobileCropHeight
    });
  };

  return (
    <div className="relative w-full" style={{ height: 'var(--hero-h)' }}>
      {/* Loading state placeholder */}
      <div className="absolute inset-0 bg-muted animate-pulse" />
      
      {hasImage ? (
        <img
          src={imageSrc}
          alt={displayName || 'Profile'}
          className="h-full w-full object-cover"
          style={{ 
            objectPosition: isMobile ? getMobileCrop() : getDesktopCropPosition(),
            objectFit: 'cover'
          }}
          loading="lazy"
          decoding="async"
          onLoad={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.previousElementSibling?.remove();
          }}
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
      ) : (
        <div className="w-full h-full bg-muted flex flex-col items-center justify-center text-muted-foreground">
          <Camera className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No Profile Photo</p>
          <p className="text-sm text-center px-4">
            {isOwnProfile ? 'Upload a photo in Edit Profile' : 'User hasn\'t uploaded a photo yet'}
          </p>
        </div>
      )}

      {/* Bottom Fade Gradient - behind panel */}
      <div className="absolute bottom-0 left-0 w-full h-16 md:h-20
                      bg-gradient-to-t from-background via-background/60 to-transparent
                      pointer-events-none z-[5]" />
    </div>
  );
};

export default ProfileHeroShell;
