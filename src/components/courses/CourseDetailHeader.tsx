import React, { useState } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExternalLinkSheet } from '@/components/shared/ExternalLinkSheet';

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
  const [showWebsiteSheet, setShowWebsiteSheet] = useState(false);

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{formatLocation(course)}</span>
          </div>
          {course.website_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWebsiteSheet(true)}
              className="h-auto py-1 px-2 text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Visit Website
            </Button>
          )}
        </div>
      </div>

      {/* External Website Sheet */}
      {course.website_url && (
        <ExternalLinkSheet
          isOpen={showWebsiteSheet}
          onClose={() => setShowWebsiteSheet(false)}
          url={course.website_url}
          title={`${course.name || 'Course'} Website`}
        />
      )}
    </div>
  );
};

export default CourseDetailHeader;
