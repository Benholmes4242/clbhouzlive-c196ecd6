import React, { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import { getMobileCropPosition } from '@/utils/mobileCropUtils';
import { cn } from '@/lib/utils';
import { CoverPhotoFallback } from '@/components/ui/CoverPhotoFallback';

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
 * ProfileHeroShell - Cinematic hero image section with parallax and gradient overlay
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
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const heroSrc = headerPhotoUrl || profilePhotoUrl || '';
  const ver = updatedAt ? new Date(updatedAt).getTime() : 0;
  const imageSrc = heroSrc ? `${heroSrc}${heroSrc.includes('?') ? '&' : '?'}v=${ver}` : '';
  
  const hasImage = Boolean(headerPhotoUrl || profilePhotoUrl);
  const useBlurredFallback = !headerPhotoUrl && profilePhotoUrl;

  // Soft parallax effect on scroll
  useEffect(() => {
    if (isMobile) return; // Skip parallax on mobile for performance
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Subtle parallax - max 20px movement
      const offset = Math.min(scrollY * 0.15, 20);
      setParallaxOffset(offset);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

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
    <div 
      ref={containerRef}
      className="relative w-full overflow-hidden" 
      style={{ 
        height: 'calc(var(--hero-h) + env(safe-area-inset-top, 0px))',
        marginTop: 'calc(-55px - env(safe-area-inset-top, 0px))',
      }}
    >
      {/* Loading state placeholder with subtle animation */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
          "transition-opacity duration-500",
          imageLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.03),transparent_50%)]" />
      </div>
      
      {hasImage ? (
        <>
          {/* Blurred background layer for profile photo fallback */}
          {useBlurredFallback && (
            <div 
              className="absolute inset-0 scale-110"
              style={{
                backgroundImage: `url(${imageSrc})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(30px) brightness(0.7)',
              }}
            />
          )}
          
          {/* Main hero image with parallax */}
          <img
            src={imageSrc}
            alt={displayName || 'Profile'}
            className={cn(
              "h-full w-full object-cover transition-all duration-700",
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]"
            )}
            style={{ 
              objectPosition: isMobile ? getMobileCrop() : getDesktopCropPosition(),
              objectFit: 'cover',
              transform: !isMobile ? `translateY(${parallaxOffset}px)` : undefined,
            }}
            loading="eager"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
              setImageLoaded(true);
            }}
          />
        </>
      ) : (
        <>
          <CoverPhotoFallback className="w-full h-full" />
          {isOwnProfile && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none">
              <Camera className="w-12 h-12 mb-3 opacity-60" />
              <p className="text-sm font-medium">Upload a cover photo in Edit Profile</p>
            </div>
          )}
        </>
      )}

      {/* Cinematic gradient overlays */}
      {/* Top vignette */}
      <div 
        className="absolute top-0 left-0 right-0 h-24 pointer-events-none z-[4]"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)',
        }}
      />
      
      {/* Bottom fade gradient - transitions to glass panel */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 w-full pointer-events-none z-[5]",
          isMobile ? "h-24" : "h-28"
        )}
        style={{
          background: 'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.8) 30%, hsl(var(--background) / 0.4) 60%, transparent 100%)',
        }}
      />
      
      {/* Subtle side vignettes for cinematic feel */}
      <div 
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.2) 100%)',
        }}
      />
    </div>
  );
};

export default ProfileHeroShell;
