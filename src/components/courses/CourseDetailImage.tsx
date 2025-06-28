
import React from 'react';
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
  if (!thumbnailImage) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
      <img
        src={thumbnailImage}
        alt={courseName}
        className="w-full h-full object-cover"
      />
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
