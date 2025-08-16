import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdaptiveProfileHeaderProps {
  userMedia?: string;
  userName: string;
  username: string;
  homeClub: string;
  isCurrentUser?: boolean;
  mediaType?: 'image' | 'video';
  onEditProfile?: () => void;
}

const AdaptiveProfileHeader: React.FC<AdaptiveProfileHeaderProps> = ({
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
        // For video, use default 4:5 unless metadata available
        setAspectRatio(4/5);
        setIsLoaded(true);
      }
    }
  }, [userMedia, mediaType]);

  // Get responsive card dimensions per specifications
  const getCardDimensions = () => {
    if (isMobile) {
      // Mobile: 90% viewport width
      const width = '90vw';
      const height = `calc(90vw / ${aspectRatio})`;
      return { width, height, maxWidth: 'none' };
    }
    
    // Desktop/tablet sizing per specifications
    const viewportWidth = window.innerWidth;
    let baseWidth: number;
    
    if (viewportWidth >= 1200) {
      // Desktop (large screens): Max width 560–640px
      baseWidth = 600;
    } else if (viewportWidth >= 1024) {
      // Laptop/Small desktops: Max width 480–560px
      baseWidth = 520;
    } else if (viewportWidth >= 768) {
      // Tablet: Max width 420–480px
      baseWidth = 450;
    } else {
      baseWidth = 400;
    }
    
    const width = `${baseWidth}px`;
    const height = `${baseWidth / aspectRatio}px`;
    
    return { width, height, maxWidth: width };
  };

  const cardDimensions = getCardDimensions();

  return (
    <div className="relative w-full overflow-hidden">
      {/* Dynamic Blur Background - Edge-to-Edge */}
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
              transform: 'scale(1.1)',
            }}
          />
        )}
        
        {/* Soft bottom white gradient for smooth transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/80" />
      </div>

      {/* Main Content Container - Card centered horizontally, slightly above vertical center */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
        {/* Liquid Glass Card */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: cardDimensions.width,
            height: cardDimensions.height,
            maxWidth: cardDimensions.maxWidth,
            // Liquid glass effect
            backgroundColor: 'rgba(255, 255, 255, 0.25)', // Semi-transparent surface ~25%
            backdropFilter: 'blur(20px) saturate(1.8)', // Backdrop blur + saturation boost
            WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)', // Thin white hairline stroke
            borderRadius: '16px', // 16px radius
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)', // Subtle wide shadow
          }}
        >
          {/* Media Content - Always fit entire media (contain/aspect-fit) */}
          {mediaType === 'video' && !reducedMotion ? (
            <video
              ref={videoRef}
              className="w-full h-full object-contain" // No cropping, no distortion
              style={{
                transition: 'opacity 300ms ease-in-out',
                opacity: isLoaded ? 1 : 0,
              }}
              autoPlay
              muted
              loop
              playsInline
              poster={userMedia} // Fallback until video loads
              onLoadedData={() => setIsLoaded(true)}
            >
              <source src={userMedia} type="video/mp4" />
            </video>
          ) : (
            <img
              src={userMedia}
              alt={`${userName}'s profile`}
              className="w-full h-full object-contain" // No cropping, no distortion
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

      {/* Profile Info - Keep as is per instructions */}
      <div className="relative z-10 text-center py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{userName}</h1>
        <p className="text-lg text-gray-600 mb-1">{username}</p>
        <p className="text-base text-gray-500">{homeClub}</p>
        
        {/* Basic stats */}
        <div className="flex justify-center gap-6 mt-6 text-sm">
          <div className="text-center">
            <div className="font-bold text-lg">156</div>
            <div className="text-gray-500">Rounds</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">12.3</div>
            <div className="text-gray-500">Handicap</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">2.5k</div>
            <div className="text-gray-500">XP</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveProfileHeader;
