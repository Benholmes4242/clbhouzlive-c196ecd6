import React from 'react';
import { MapPin, Star } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  regional_rank: number;
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

  // Get the primary image or use a placeholder
  const courseImage = course.images?.[0] || `https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&h=800&fit=crop&q=80`;

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
          {/* Ranking badges */}
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-black">#{course.regional_rank}</div>
                <div className="text-sm text-gray-600 font-medium">Official Rank</div>
              </div>
            </div>

            <div className="bg-orange-500/90 backdrop-blur-sm rounded-full px-6 py-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">#{communityRank}</div>
                <div className="text-sm text-orange-100 font-medium">Community Rank</div>
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
            <span>{course.region || course.country}</span>
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

          {/* Description */}
          {course.description && (
            <p className="text-white/90 text-lg leading-relaxed max-w-3xl overflow-hidden" style={{
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical' as const
            }}>
              {course.description}
            </p>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-4 left-8 right-8 z-10">
        <div className="h-1 bg-white/20 rounded-full">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${((course.regional_rank) / 100) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default GBICarouselSlide;