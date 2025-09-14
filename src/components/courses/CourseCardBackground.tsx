import React from 'react';

interface CourseCardBackgroundProps {
  thumbnailImage?: string;
  courseName: string;
  disableLazyLoading?: boolean;
}

const CourseCardBackground: React.FC<CourseCardBackgroundProps> = ({ 
  thumbnailImage, 
  courseName,
  disableLazyLoading = false
}) => {
  return (
    <div className="absolute inset-0">
      <img 
        src={thumbnailImage 
          ? thumbnailImage
          : `https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop`}
        alt={`Background image for ${courseName}`}
        className="absolute inset-0 w-full h-full object-cover"
        loading={disableLazyLoading ? "eager" : "lazy"}
        decoding="async"
      />
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
    </div>
  );
};

export default React.memo(CourseCardBackground);