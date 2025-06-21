
import React from 'react';

interface CourseDetailImageProps {
  thumbnailImage?: string;
  courseName: string;
}

const CourseDetailImage = ({ thumbnailImage, courseName }: CourseDetailImageProps) => {
  if (!thumbnailImage) return null;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg">
      <img
        src={thumbnailImage}
        alt={courseName}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default CourseDetailImage;
