
import React from 'react';
import { Star } from 'lucide-react';
import CourseRankBadges from './CourseRankBadges';

interface CourseDetailImageProps {
  thumbnailImage?: string;
  courseName: string;
  globalRank?: number | null;
  regionalRank?: number | null;
  usaRank?: number | null;
  country: string;
}

const CourseDetailImage = ({ 
  thumbnailImage, 
  courseName, 
  globalRank, 
  regionalRank, 
  usaRank, 
  country 
}: CourseDetailImageProps) => {
  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden">
      {thumbnailImage ? (
        <img
          src={thumbnailImage}
          alt={courseName}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=400&fit=crop';
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
          <Star className="h-16 w-16 text-white opacity-50" />
        </div>
      )}

      {/* Course Rank Badges */}
      <CourseRankBadges
        globalRank={globalRank}
        regionalRank={regionalRank}
        usaRank={usaRank}
        country={country}
      />
    </div>
  );
};

export default CourseDetailImage;
