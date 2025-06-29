
import React from 'react';

interface CourseDetailInfoProps {
  description?: string;
}

// Helper function to format description text with line breaks
const formatDescription = (description: string) => {
  return description
    .split('\n')
    .map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ));
};

const CourseDetailInfo = ({ description }: CourseDetailInfoProps) => {
  return (
    <>
      {/* Description */}
      {description && (
        <div>
          <p className="text-muted-foreground leading-relaxed">
            {formatDescription(description)}
          </p>
        </div>
      )}
    </>
  );
};

export default CourseDetailInfo;
