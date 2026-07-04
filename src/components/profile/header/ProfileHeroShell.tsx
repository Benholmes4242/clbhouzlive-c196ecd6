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

  // Cover image is rendered as its own absolutely-positioned layer locked
  // to 3:2 of the container width — the exact aspect the editor previews.
  // The content box may be TALLER than 3:2 (safe area, name row, etc.); we
  // don't stretch the image to fill that extra height, so what the user
  // framed is exactly what shows. Content extends below the image over the
  // dark background.
  const focal = isMobile ? getMobileCrop() : getDesktopCropPosition();
  const heroScrim =
    'linear-gradient(180deg, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0.1) 20%, rgba(15,23,42,0) 40%, rgba(15,23,42,0.5) 100%)';

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{
        minHeight: 'calc(var(--profile-hero-h) + env(safe-area-inset-top, 0px))',
        backgroundColor: '#0F172A',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Cover image layer — 3:2, matches editor preview exactly. */}
      {hasImage && imageSrc ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            aspectRatio: '3 / 2',
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: focal,
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
          }}
        />
      ) : (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            aspectRatio: '3 / 2',
            background: 'linear-gradient(180deg,#1E4D38,#0F172A)',
            zIndex: 0,
          }}
        />
      )}
      {/* Scrim over the cover image only */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          aspectRatio: '3 / 2',
          background: heroScrim,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      {!hasImage && isOwnProfile && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 pointer-events-none" style={{ zIndex: 2 }}>
          <Camera className="w-12 h-12 mb-3 opacity-60" />
          <p className="text-sm font-medium">Upload a cover photo in Edit Profile</p>
        </div>
      )}
      {/* Mark image as loaded immediately for fade hooks downstream (no img el). */}
      {!imageLoaded && <ImageLoadProbe src={imageSrc} onLoaded={() => setImageLoaded(true)} />}
    </div>
  );
};

// Tiny helper: preload the cover so downstream loaded-state callbacks still fire.
const ImageLoadProbe: React.FC<{ src: string; onLoaded: () => void }> = ({ src, onLoaded }) => {
  useEffect(() => {
    if (!src) { onLoaded(); return; }
    const img = new Image();
    img.onload = onLoaded;
    img.onerror = onLoaded;
    img.src = src;
  }, [src, onLoaded]);
  return null;
};

export default ProfileHeroShell;
