
import React from 'react';

interface CourseImageProps {
  src: string;
  alt: string;
  className?: string;
}

const CourseImage = ({ src, alt, className }: CourseImageProps) => {
  return (
    <img
      src={src || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'}
      alt={alt}
      className={className}
    />
  );
};

export default CourseImage;
