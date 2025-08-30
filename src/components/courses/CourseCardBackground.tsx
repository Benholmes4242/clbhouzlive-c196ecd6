import React from 'react';

interface CourseCardBackgroundProps {
  thumbnailImage?: string;
  courseName: string;
}

const CourseCardBackground: React.FC<CourseCardBackgroundProps> = ({ 
  thumbnailImage, 
  courseName 
}) => {
  // Debug log to see if background is rendering
  console.log('CourseCardBackground rendering:', { courseName, thumbnailImage });
  
  return (
    <div 
      className="absolute inset-0 bg-cover bg-center"
      style={{
        backgroundImage: thumbnailImage 
          ? `url(${thumbnailImage})`
          : `url('https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop')`
      }}
      role="img"
      aria-label={`Background image for ${courseName}`}
    >
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
    </div>
  );
};

export default React.memo(CourseCardBackground);