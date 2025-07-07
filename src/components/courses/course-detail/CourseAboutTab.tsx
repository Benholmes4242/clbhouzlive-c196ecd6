import React from 'react';
import { Badge } from '@/components/ui/badge';

interface Course {
  id: string;
  name: string;
  country: string;
  region?: string;
  sub_country?: string;
  continent?: string;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
  country_rank?: number | null;
  description?: string;
  thumbnail_image?: string;
  latitude?: number | null;
  longitude?: number | null;
  website_url?: string | null;
}

interface CourseAboutTabProps {
  course: Course;
}

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

const CourseAboutTab = ({ course }: CourseAboutTabProps) => {
  return (
    <div className="space-y-8">
      {/* Rankings */}
      {(course.global_rank || course.regional_rank || course.usa_rank || course.country_rank) && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Rankings</h2>
          <div className="flex flex-wrap gap-3">
            {course.global_rank && (
              <Badge variant="secondary" className="text-lg px-4 py-2">
                #{course.global_rank} Global
              </Badge>
            )}
            {course.regional_rank && (
              <Badge variant="secondary" className="text-lg px-4 py-2">
                #{course.regional_rank} Regional
              </Badge>
            )}
            {course.usa_rank && (
              <Badge variant="secondary" className="text-lg px-4 py-2">
                #{course.usa_rank} USA
              </Badge>
            )}
            {course.country_rank && (
              <Badge variant="secondary" className="text-lg px-4 py-2">
                #{course.country_rank} {course.country}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {course.description && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">About This Course</h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            {formatDescription(course.description)}
          </p>
        </div>
      )}

      {/* Location Details */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Country:</span>
              <span className="font-medium">{course.country}</span>
            </div>
            {course.region && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Region:</span>
                <span className="font-medium">{course.region}</span>
              </div>
            )}
            {course.sub_country && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Area:</span>
                <span className="font-medium">{course.sub_country}</span>
              </div>
            )}
            {course.continent && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Continent:</span>
                <span className="font-medium">{course.continent}</span>
              </div>
            )}
          </div>
          
          {(course.latitude && course.longitude) && (
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-medium mb-2">Coordinates</h3>
              <p className="text-sm text-muted-foreground">
                {course.latitude.toFixed(6)}, {course.longitude.toFixed(6)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Map placeholder - could be enhanced with actual map */}
      {(course.latitude && course.longitude) && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Location Map</h2>
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Map view coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseAboutTab;