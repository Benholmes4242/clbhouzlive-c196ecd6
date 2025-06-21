
import React from 'react';
import { MapPin } from 'lucide-react';

interface CourseDetailInfoProps {
  region?: string;
  country: string;
  description?: string;
}

const CourseDetailInfo = ({ region, country, description }: CourseDetailInfoProps) => {
  return (
    <>
      {/* Location */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>{region ? `${region}, ${country}` : country}</span>
      </div>

      {/* Description */}
      {description && (
        <div>
          <h3 className="font-semibold mb-2">About This Course</h3>
          <p className="text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      )}
    </>
  );
};

export default CourseDetailInfo;
