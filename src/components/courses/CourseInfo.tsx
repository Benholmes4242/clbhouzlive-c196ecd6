
import React from 'react';
import { MapPin, Star } from 'lucide-react';

interface UserCourse {
  id: string;
  played: boolean;
  rating?: number;
}

interface CourseInfoProps {
  name: string;
  region?: string;
  country: string;
  description?: string;
  userCourse: UserCourse | null;
}

const CourseInfo = ({ name, region, country, description, userCourse }: CourseInfoProps) => {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
          {name}
        </h3>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <MapPin className="h-3 w-3 mr-1" />
          <span>{region ? `${region}, ` : ''}{country}</span>
        </div>
      </div>

      {description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
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
