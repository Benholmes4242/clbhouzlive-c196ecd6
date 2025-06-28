
import React from 'react';
import { MapPin } from 'lucide-react';

interface CourseDetailInfoProps {
  region?: string;
  country: string;
  sub_country?: string;
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

// Helper function to format location display
const formatLocation = (props: { country: string; sub_country?: string; region?: string }) => {
  const parts = [];
  
  // Always start with country
  parts.push(props.country);
  
  // Add sub_country if it exists
  if (props.sub_country) {
    parts.push(props.sub_country);
  }
  
  // Add region if it exists and is different from country
  if (props.region && props.region !== props.country) {
    parts.push(props.region);
  }
  
  return parts.join(', ');
};

const CourseDetailInfo = ({ region, country, sub_country, description }: CourseDetailInfoProps) => {
  return (
    <>
      {/* Location */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>{formatLocation({ country, sub_country, region })}</span>
      </div>

      {/* Description */}
      {description && (
        <div>
          <h3 className="font-semibold mb-2">About This Course</h3>
          <p className="text-muted-foreground leading-relaxed">
            {formatDescription(description)}
          </p>
        </div>
      )}
    </>
  );
};

export default CourseDetailInfo;
