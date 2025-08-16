import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProfileHeaderProps {
  userMedia?: string; // URL to user's uploaded image/video
  userName: string;
  username: string;
  homeClub: string;
  isCurrentUser?: boolean;
  mediaType?: 'image' | 'video';
  onEditProfile?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userMedia = '/lovable-uploads/c61119e7-5f19-471e-85a9-5de43d1a45a0.png',
  userName = 'Benjamin Holmes',
  username = '@benjaminholmes',
  homeClub = 'Sundridge Park Golf Club',
  isCurrentUser = true,
  mediaType = 'image',
  onEditProfile
}) => {
  const isMobile = useIsMobile();
  const [isLoaded, setIsLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(4/5); // Default 4:5 portrait
  const [reducedMotion, setReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Calculate adaptive aspect ratio based on media
  useEffect(() => {
    if (userMedia) {
      if (mediaType === 'image') {
        const img = new Image();
        img.onload = () => {
          const newAspectRatio = img.width / img.height;
          // Constrain between 4:5 portrait and 16:9 landscape
          const constrainedRatio = Math.max(4/5, Math.min(16/9, newAspectRatio));
          setAspectRatio(constrainedRatio);
          setIsLoaded(true);
        };
        img.src = userMedia;
      } else {
        // For video, we'll use default 4:5 unless we can get metadata
        setAspectRatio(4/5);
        setIsLoaded(true);
      }
    }
  }, [userMedia, mediaType]);

  // Get responsive card dimensions
  const getCardDimensions = () => {
    if (isMobile) {
      const width = '90vw';
      const height = `calc(90vw / ${aspectRatio})`;
      return { width, height, maxWidth: 'none' };
    }
    
    // Desktop/tablet sizing
    const baseWidth = window.innerWidth > 1200 ? 600 : 
                     window.innerWidth > 768 ? 500 : 450;
    const width = `${baseWidth}px`;
    const height = `${baseWidth / aspectRatio}px`;
    
    return { width, height, maxWidth: width };
  };

  const cardDimensions = getCardDimensions();

  return (
    <div className="relative w-full overflow-hidden">
      {/* Dynamic Blur Background */}
      <div className="absolute inset-0 z-0">
        {mediaType === 'video' && !reducedMotion ? (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: 'blur(20px) saturate(1.2)',
              transform: 'scale(1.1)', // Prevent blur edge artifacts
            }}
            autoPlay
            muted
            loop
            playsInline
            poster={userMedia}
          >
            <source src={userMedia} type="video/mp4" />
          </video>
        ) : (
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${userMedia})`,
              filter: 'blur(20px) saturate(1.2)',
              transform: 'scale(1.1)', // Prevent blur edge artifacts
            }}
          />
        )}
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white/80" />
        
        {/* Optional radial vignette */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/10" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] px-4 py-8">
        {/* Media Card */}
        <div
          ref={cardRef}
          className="relative mb-8 rounded-2xl overflow-hidden"
          style={{
            width: cardDimensions.width,
            height: cardDimensions.height,
            maxWidth: cardDimensions.maxWidth,
          }}
        >
          {/* Media Content */}
          {mediaType === 'video' && !reducedMotion ? (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              style={{
                transition: 'opacity 300ms ease-in-out',
                opacity: isLoaded ? 1 : 0,
              }}
              autoPlay
              muted
              loop
              playsInline
              poster={userMedia}
              onLoadedData={() => setIsLoaded(true)}
            >
              <source src={userMedia} type="video/mp4" />
            </video>
          ) : (
            <img
              src={userMedia}
              alt={`${userName}'s profile`}
              className="w-full h-full object-contain"
              style={{
                transition: 'opacity 300ms ease-in-out',
                opacity: isLoaded ? 1 : 0,
              }}
              onLoad={() => setIsLoaded(true)}
            />
          )}
          
          {/* Loading placeholder */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/10">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfileHeader;