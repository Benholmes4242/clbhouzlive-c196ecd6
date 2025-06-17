
import React from 'react';

interface CourseImageProps {
  thumbnailImage: string;
  name: string;
  isHovered: boolean;
}

const CourseImage = ({ thumbnailImage, name, isHovered }: CourseImageProps) => {
  return (
    <div className="h-48 overflow-hidden">
      <img
        src={thumbnailImage || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'}
        alt={name}
        className={`w-full h-full object-cover transition-transform duration-300 ${
          isHovered ? 'scale-105' : 'scale-100'
        }`}
      />
    </div>
  );
};

export default CourseImage;
