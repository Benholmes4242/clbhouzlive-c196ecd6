
import React from 'react';
import { MapPin, Star } from 'lucide-react';

interface UserCourse {
  id: string;
  played: boolean;
  rating?: number;
}

interface Course {
  name: string;
  region?: string;
  country: string;
  sub_country?: string;
}

interface CourseInfoProps {
  name: string;
  region?: string;
  country: string;
  sub_country?: string;
  description?: string;
  userCourse: UserCourse | null;
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
const formatLocation = (props: { sub_country?: string; region?: string; country: string }) => {
  const parts = [];
  
  if (props.sub_country) {
    parts.push(props.sub_country);
  }
  
  if (props.region && props.region !== props.country) {
    parts.push(props.region);
  }
  
  parts.push(props.country);
  
  return parts.join(', ');
};

const CourseInfo = ({ name, region, country, sub_country, description, userCourse }: CourseInfoProps) => {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
          {name}
        </h3>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <MapPin className="h-3 w-3 mr-1" />
          <span>{formatLocation({ sub_country, region, country })}</span>
        </div>
      </div>

      {description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {formatDescription(description)}
        </p>
      )}

      {userCourse?.rating && (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{userCourse.rating}/5</span>
        </div>
      )}
    </div>
  );
};

export default CourseInfo;
