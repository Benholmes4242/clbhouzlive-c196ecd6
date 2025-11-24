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
          ? `${thumbnailImage}?w=600&h=400&fit=crop&q=80`
          : `https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600&h=400&fit=crop`}
        srcSet={thumbnailImage 
          ? `${thumbnailImage}?w=400&h=300&fit=crop&q=80 400w,
             ${thumbnailImage}?w=800&h=600&fit=crop&q=80 800w,
             ${thumbnailImage}?w=1200&h=800&fit=crop&q=85 1200w`
          : undefined}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        alt={`Background image for ${courseName}`}
        className="absolute inset-0 w-full h-full object-cover scale-[1.03]"
        loading={disableLazyLoading ? "eager" : "lazy"}
        decoding="async"
      />
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
    </div>
  );
};

export default React.memo(CourseCardBackground);