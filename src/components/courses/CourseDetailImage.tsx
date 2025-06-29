
import React from 'react';
import CourseRankBadges from './CourseRankBadges';

interface CourseDetailImageProps {
  thumbnailImage?: string;
  courseName: string;
  globalRank?: number | null;
  regionalRank?: number | null;
  usaRank?: number | null;
  country: string;
  showUserRating?: boolean;
  userRating?: number | null;
}

const CourseDetailImage: React.FC<CourseDetailImageProps> = ({
  thumbnailImage,
  courseName,
  globalRank,
  regionalRank,
  usaRank,
  country,
  showUserRating = false,
  userRating
}) => {
  return (
    <div className="relative h-64 rounded-lg overflow-hidden">
      <img
        src={thumbnailImage || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=400&fit=crop'}
        alt={courseName}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=400&fit=crop';
        }}
      />
      <CourseRankBadges
        globalRank={globalRank}
        regionalRank={regionalRank}
        usaRank={usaRank}
        country={country}
        showUserRating={showUserRating}
        userRating={userRating}
      />
    </div>
  );
};

export default CourseDetailImage;
