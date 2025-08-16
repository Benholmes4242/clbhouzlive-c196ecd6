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
        {/* Liquid Glass Card */}
        <div
          ref={cardRef}
          className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            width: cardDimensions.width,
            height: cardDimensions.height,
            maxWidth: cardDimensions.maxWidth,
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
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

        {/* Profile Information */}
        <div className="text-center space-y-4 max-w-lg">
          {/* Name */}
          <h1 
            className="text-4xl md:text-5xl font-bold text-white"
            style={{
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.5)',
            }}
          >
            {userName}
          </h1>

          {/* Username and Edit Profile */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span 
              className="text-lg text-white/90 font-medium"
              style={{
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
              }}
            >
              {username}
            </span>
            
            {isCurrentUser && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onEditProfile}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white font-medium px-4 py-2 rounded-full transition-all duration-200"
                style={{
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                Edit Profile
              </Button>
            )}
          </div>

          {/* Home Club */}
          <p 
            className="text-lg text-white/80"
            style={{
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
            }}
          >
            {homeClub}
          </p>

          {/* Stats Bar (Frosted Glass Chip) */}
          <div 
            className="inline-flex items-center gap-6 px-6 py-3 rounded-full text-sm font-medium text-white"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(15px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(15px) saturate(1.6)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div className="text-center">
              <div className="font-bold text-lg">156</div>
              <div className="text-xs opacity-80">Rounds</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="font-bold text-lg">12.3</div>
              <div className="text-xs opacity-80">Handicap</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="font-bold text-lg">2.5k</div>
              <div className="text-xs opacity-80">XP</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;