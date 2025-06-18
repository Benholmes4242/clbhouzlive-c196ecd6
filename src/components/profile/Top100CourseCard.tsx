
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Globe, MapPin } from 'lucide-react';

interface Top100CourseCardProps {
  course: any;
  isPlayed: boolean;
  region: string;
}

const Top100CourseCard: React.FC<Top100CourseCardProps> = ({
  course,
  isPlayed,
  region
}) => {
  // Get regional label for badges
  const getRegionalLabel = (course: any) => {
    if (course.country === 'United Kingdom' || course.country === 'Ireland') {
      return 'GB&I';
    }
    return 'Regional';
  };

  const regionalLabel = getRegionalLabel(course);

  return (
    <div
      className={`relative rounded-lg border overflow-hidden transition-all duration-300 ${
        isPlayed 
          ? 'bg-green-50 border-green-200 shadow-md' 
          : 'bg-card hover:shadow-lg'
      }`}
    >
      {/* Course Image */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={course.thumbnail_image || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'}
          alt={course.name}
          className="w-full h-full object-cover"
        />
        
        {/* Rank Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {/* Gold badge - always shows global rank */}
          {course.global_rank && (
            <Badge className="bg-yellow-500 text-yellow-900 hover:bg-yellow-500 text-xs">
              <Globe className="h-2 w-2 mr-1" />
              {course.global_rank}
            </Badge>
          )}
          {/* Grey badge - shows regional rank when viewing regional lists */}
          {course.regional_rank && region !== 'global' && (
            <Badge variant="secondary" className="text-xs">
              {regionalLabel} {course.regional_rank}
            </Badge>
          )}
        </div>

        {/* Played Indicator */}
        {isPlayed && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center shadow-sm">
              <Check className="h-3 w-3 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1">
          {course.name}
        </h3>
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <MapPin className="h-2 w-2 mr-1" />
          <span>{course.region ? `${course.region}, ` : ''}{course.country}</span>
        </div>
        {course.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default Top100CourseCard;
