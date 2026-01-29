import React from 'react';
import { Building2 } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';
import CoursePostBadge from '../../CoursePostBadge';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region?: string;
}

interface UserInfoOverlayProps {
  user: {
    id: string;
    profile_photo_url: string | null;
  };
  displayName: string;
  avatarUrl?: string | null;
  onProfileClick: () => void;
  /** @deprecated Use courses array instead */
  golfCourse?: GolfCourse | null;
  /** Array of golf courses for multi-course support */
  courses?: GolfCourse[];
  source?: 'profile' | 'index';
  /** Whether this is a business post */
  isBusinessPost?: boolean;
  /** Whether the business is verified */
  isVerified?: boolean;
}

export const UserInfoOverlay: React.FC<UserInfoOverlayProps> = ({
  user,
  displayName,
  avatarUrl,
  onProfileClick,
  golfCourse,
  courses: coursesProp,
  source,
  isBusinessPost = false,
  isVerified = false
}) => {
  const isClubhouse = source === 'index';
  
  // Normalize courses: use coursesProp if provided, else wrap golfCourse for backward compat
  const courses = coursesProp && coursesProp.length > 0 
    ? coursesProp 
    : (golfCourse ? [golfCourse] : []);
  
  // Use provided avatarUrl or fall back to user's profile photo
  const photoUrl = avatarUrl ?? user.profile_photo_url;
  
  return (
    <>
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/35 pointer-events-none" />
      
      <div className="absolute top-3 left-3 z-20">
        <div 
          className="cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            onProfileClick();
          }}
        >
          <div className="flex items-center gap-3">
            {/* Enhanced Profile Photo with XP Ring */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-white/10 blur-sm animate-pulse"></div>
              <OptimizedImage
                src={getOptimizedImageUrl(
                  photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face',
                  64,
                  64
                )}
                alt={displayName}
                className="relative w-16 h-16 rounded-full object-cover ring-2 ring-white/30 group-hover:ring-white/50 transition-all duration-300 group-hover:scale-110"
                width={64}
                height={64}
                priority={true}
              />
            </div>
            
            {/* User Info with Glassmorphic Background */}
            <div className="relative">
              <div 
                className="absolute inset-0 rounded-2xl backdrop-blur-md border border-white/20"
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
                }}
              />
              <div className="relative px-4 py-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span 
                    className="text-white text-base font-semibold leading-tight"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {displayName}
                  </span>
                  {isVerified && (
                    <VerifiedBadge size="sm" />
                  )}
                  {isBusinessPost && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-medium text-white/80">
                      <Building2 className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                
                {/* Golf Course Badge - Only show on clubhouse page */}
                {isClubhouse && courses.length > 0 && (
                  <div className="opacity-80 text-sm font-medium text-white/90">
                    <CoursePostBadge 
                      courses={courses}
                      isClubhouse={true}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};