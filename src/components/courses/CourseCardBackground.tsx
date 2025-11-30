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
  const [isLoaded, setIsLoaded] = React.useState(false);

  return (
    <div className="absolute inset-0">
      {/* D2: Blur placeholder while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
      )}
      
      {/* D3: Reduced mobile image sizes */}
      <img 
        src={thumbnailImage 
          ? `${thumbnailImage}?w=400&h=300&fit=crop&q=80`
          : `https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop`}
        srcSet={thumbnailImage 
          ? `${thumbnailImage}?w=400&h=300&fit=crop&q=80 400w,
             ${thumbnailImage}?w=600&h=450&fit=crop&q=80 600w,
             ${thumbnailImage}?w=800&h=600&fit=crop&q=85 800w`
          : undefined}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        alt={`Background image for ${courseName}`}
        className={`absolute inset-0 w-full h-full object-cover scale-[1.03] transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading={disableLazyLoading ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
      />
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
    </div>
  );
};

export default React.memo(CourseCardBackground);