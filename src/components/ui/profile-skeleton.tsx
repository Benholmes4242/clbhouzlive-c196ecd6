import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ProfileSkeleton: React.FC = () => {
  return (
    <div className="w-full min-h-screen pb-28 relative">
      {/* Background Skeleton */}
      <div 
        className="absolute inset-0 w-full transition-all duration-500"
        style={{ 
          height: '420px',
          background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground)) 100%)',
          filter: 'blur(40px) saturate(1.3) brightness(0.9)',
          transform: 'scale(1.2)',
        }}
      />
      
      {/* Profile Content Skeleton */}
      <div className="relative z-10 flex flex-col items-center text-center pt-20 pb-8 px-4">
        {/* Large Profile Photo Skeleton */}
        <Skeleton className="w-64 h-64 rounded-full mb-6" />
        
        {/* Name Skeleton */}
        <Skeleton className="h-8 w-48 mb-2" />
        
        {/* Username Skeleton */}
        <Skeleton className="h-6 w-32 mb-2" />
        
        {/* Home Club Skeleton */}
        <Skeleton className="h-5 w-40 mb-6" />
        
        {/* Stats Row Skeleton */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl w-full max-w-md">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-6 w-8 mx-auto mb-2" />
                <Skeleton className="h-4 w-12 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Navigation Cards Skeleton */}
      <div className="px-4 md:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative h-48 rounded-2xl overflow-hidden">
              <Skeleton className="w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Content Area Skeleton */}
      <div className="px-4 md:px-8 mt-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;