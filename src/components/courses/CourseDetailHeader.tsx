
import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  description?: string;
  thumbnail_image?: string;
  latitude?: number | null;
  longitude?: number | null;
  website_url?: string | null;
}

interface CourseDetailHeaderProps {
  course: Course;
}

const CourseDetailHeader = ({ course }: CourseDetailHeaderProps) => {
  const formatLocation = (course: Course) => {
    const parts = [];
    
    // Always start with country
    parts.push(course.country);
    
    // Add sub_country if it exists
    if (course.sub_country) {
      parts.push(course.sub_country);
    }
    
    // Add region if it exists and is different from country
    if (course.region && course.region !== course.country) {
      parts.push(course.region);
    }
    
    return parts.join(', ');
  };

  return (
    <div className="flex flex-col space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{course.name}</h2>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span>{formatLocation(course)}</span>
          {course.website_url && (
            <>
              <span className="text-muted-foreground">—</span>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-auto py-1 px-2 text-xs"
              >
                <a
                  href={course.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Visit Website
                </a>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailHeader;
