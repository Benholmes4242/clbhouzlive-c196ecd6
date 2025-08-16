import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Edit3, Users, Trophy, Target, Calendar } from 'lucide-react';

interface ProfileHeaderProps {
  userMedia: string;
  userName: string;
  username: string;
  homeClub: string;
  isCurrentUser?: boolean;
  mediaType?: 'image' | 'video';
  onEditProfile?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userMedia,
  userName,
  username,
  homeClub,
  isCurrentUser = false,
  mediaType = 'image',
  onEditProfile
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(4/5); // Default 4:5 portrait
  const headerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Intersection Observer for performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Determine adaptive aspect ratio
  const handleMediaLoad = useCallback((element: HTMLImageElement | HTMLVideoElement) => {
    let width: number, height: number;
    
    if (element instanceof HTMLVideoElement) {
      width = element.videoWidth;
      height = element.videoHeight;
    } else {
      width = element.naturalWidth;
      height = element.naturalHeight;
    }
    
    if (width && height) {
      const ratio = width / height;
      
      // Clamp between 4:5 (0.8) and 16:9 (1.78)
      if (ratio <= 0.8) {
        setAspectRatio(4/5); // Portrait
      } else if (ratio >= 1.78) {
        setAspectRatio(16/9); // Max landscape
      } else if (ratio > 0.9 && ratio < 1.1) {
        setAspectRatio(1); // Square
      } else {
        setAspectRatio(ratio); // Adaptive
      }
    }
  }, []);

  // Handle video loading
  useEffect(() => {
    if (mediaType === 'video' && isIntersecting && !reducedMotion) {
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.addEventListener('loadeddata', () => {
          setVideoLoaded(true);
          handleMediaLoad(videoRef.current!);
        });
      }
      if (backgroundVideoRef.current) {
        backgroundVideoRef.current.load();
      }
    }
  }, [isIntersecting, mediaType, reducedMotion, handleMediaLoad]);

  const cardMaxWidths = {
    desktop: 'max-w-[640px]',
    laptop: 'lg:max-w-[560px]',
    tablet: 'md:max-w-[480px]',
    mobile: 'w-[90%]'
  };

  return (
    <div 
      ref={headerRef}
      className="relative w-full h-[85vh] max-h-[800px] min-h-[600px] overflow-hidden"
      style={{ willChange: 'transform' }}
    >
      {/* Dynamic Blur Background Layer - z-0 */}
      <div className="absolute inset-0 z-0">
        {mediaType === 'video' && isIntersecting && !reducedMotion ? (
          <video
            ref={backgroundVideoRef}
            className="absolute inset-0 w-full h-full object-cover scale-110"
            style={{ 
              filter: 'blur(20px) saturate(1.1)',
              willChange: 'transform'
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
            className="absolute inset-0 w-full h-full bg-cover bg-center scale-110"
            style={{
              backgroundImage: `url(${userMedia})`,
              filter: 'blur(20px) saturate(1.1)',
              willChange: 'transform'
            }}
          />
        )}
        
        {/* Gradient overlay for page blend */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
        
        {/* Subtle radial vignette */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/10" />
      </div>

      {/* Content Container - z-10 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 pt-8">
        
        {/* Liquid Glass Media Card - z-20 */}
        <div 
          className={`
            relative mb-8 ${cardMaxWidths.desktop} ${cardMaxWidths.laptop} ${cardMaxWidths.tablet} ${cardMaxWidths.mobile}
            rounded-2xl backdrop-blur-md bg-white/25 
            border border-white/20 shadow-2xl shadow-black/20
            animate-fade-in
          `}
          style={{
            aspectRatio: aspectRatio,
            willChange: 'transform',
            backdropFilter: 'blur(12px) saturate(1.2)'
          }}
        >
          {mediaType === 'video' ? (
            <video
              ref={videoRef}
              className="w-full h-full object-contain rounded-2xl"
              autoPlay={isIntersecting && !reducedMotion}
              muted
              loop
              playsInline
              poster={userMedia}
              onLoadedData={() => {
                setVideoLoaded(true);
                handleMediaLoad(videoRef.current!);
              }}
            >
              <source src={userMedia} type="video/mp4" />
            </video>
          ) : (
            <img
              src={userMedia}
              alt={`${userName}'s profile`}
              className="w-full h-full object-contain rounded-2xl"
              onLoad={(e) => handleMediaLoad(e.currentTarget)}
              loading="eager"
            />
          )}
        </div>

        {/* Profile Information - z-30 */}
        <div className="text-center space-y-4 max-w-lg">
          {/* Name and Username */}
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground drop-shadow-sm">
              {userName}
            </h1>
            <p className="text-lg text-muted-foreground drop-shadow-sm">
              {username}
            </p>
          </div>

          {/* Edit Profile Button */}
          {isCurrentUser && (
            <Button
              onClick={onEditProfile}
              variant="outline"
              className="bg-white/20 backdrop-blur-sm border-white/30 text-foreground hover:bg-white/30 transition-all duration-200"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}

          {/* Home Club */}
          <div className="inline-block px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/20">
            <p className="text-sm font-medium text-foreground drop-shadow-sm">
              🏌️ {homeClub}
            </p>
          </div>

          {/* Stats Bar - Frosted Glass */}
          <div className="flex justify-center gap-4 p-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 shadow-lg">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Users className="w-4 h-4 text-foreground mr-1" />
              </div>
              <p className="text-lg font-bold text-foreground drop-shadow-sm">127</p>
              <p className="text-xs text-muted-foreground drop-shadow-sm">Following</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Trophy className="w-4 h-4 text-foreground mr-1" />
              </div>
              <p className="text-lg font-bold text-foreground drop-shadow-sm">23</p>
              <p className="text-xs text-muted-foreground drop-shadow-sm">Tournaments</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Target className="w-4 h-4 text-foreground mr-1" />
              </div>
              <p className="text-lg font-bold text-foreground drop-shadow-sm">8.2</p>
              <p className="text-xs text-muted-foreground drop-shadow-sm">Handicap</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Calendar className="w-4 h-4 text-foreground mr-1" />
              </div>
              <p className="text-lg font-bold text-foreground drop-shadow-sm">156</p>
              <p className="text-xs text-muted-foreground drop-shadow-sm">Rounds</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;