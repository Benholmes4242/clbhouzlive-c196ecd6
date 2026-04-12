
import React from 'react';

interface CourseDetailInfoProps {
  description?: string;
}

const CourseDetailInfo = ({ description }: CourseDetailInfoProps) => {
  return (
    <>
      {description && (
        <div>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        </div>
      )}
    </>
  );
};

export default CourseDetailInfo;
