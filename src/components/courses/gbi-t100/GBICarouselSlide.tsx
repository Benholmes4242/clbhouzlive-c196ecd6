import React from 'react';
import { MapPin, Star } from 'lucide-react';
import { getOptimizedImageUrl, getResponsiveImageSizes } from '@/utils/imageOptimization';

interface Course {
  id: string;
  name: string;
  regional_rank: number;
  global_rank?: number;
  country: string;
  region?: string;
  images?: string[];
  description?: string;
  par?: number;
  yards?: number;
}

interface GBICarouselSlideProps {
  course: Course;
  isActive: boolean;
}

const GBICarouselSlide: React.FC<GBICarouselSlideProps> = ({ course, isActive }) => {
  // Mock community rank for now - this could be calculated from user ratings
  const getCommunityRank = (officialRank: number) => {
    // Simple mock calculation - in real implementation, this would come from user data
    return Math.max(1, officialRank + Math.floor(Math.random() * 10 - 5));
  };

  const communityRank = getCommunityRank(course.regional_rank);

  // Get responsive image sizes based on screen size
  const responsiveSize = getResponsiveImageSizes();
  
  // Get the primary image or use a placeholder
  const baseImage = course.images?.[0] || `https://images.unsplash.com/photo-1535131749006-b7f58c99034b`;
  const courseImage = getOptimizedImageUrl(baseImage, responsiveSize.width, responsiveSize.height, 85, 'webp');

  return (
    <div className="relative w-full h-full">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${courseImage})`,
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8 pb-20">
        <div className="max-w-4xl">
          {/* Ranking badges positioned like your reference image */}
          <div className="flex items-center gap-4 mb-6">
            {/* Global Rank badge */}
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
              <span className="text-white text-sm">🌍</span>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">#{course.global_rank || 'N/A'}</div>
              </div>
            </div>

            {/* GB&I Regional Rank badge */}
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
              <img src="https://flagcdn.com/w20/gb.png" alt="GB" className="w-5 h-3" />
              <div className="text-center">
                <div className="text-2xl font-bold text-black">#{course.regional_rank}</div>
              </div>
            </div>
          </div>

          {/* Course Name */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {course.name}
          </h1>

          {/* Location */}
          <div className="flex items-center gap-2 text-white/90 text-xl mb-6">
            <MapPin className="h-6 w-6" />
            <span>{course.country}, {course.region}</span>
          </div>

          {/* Course Details */}
          {(course.par || course.yards) && (
            <div className="flex items-center gap-6 text-white/80 text-lg mb-6">
              {course.par && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Par:</span>
                  <span>{course.par}</span>
                </div>
              )}
              {course.yards && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Yards:</span>
                  <span>{course.yards?.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Add to Played button in bottom right */}
          <div className="absolute bottom-8 right-8">
            <button className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition-colors">
              Add to Played
            </button>
          </div>

          {/* Star rating at bottom left */}
          <div className="absolute bottom-8 left-8 flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-400" fill="currentColor" />
            <span className="text-white text-lg font-medium">0/10</span>
            <span className="text-white/60 text-sm">(0 votes)</span>
          </div>
        </div>

        {/* Progress indicator removed - not needed for this design */}
      </div>
    </div>
  );
};

export default GBICarouselSlide;