
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Flag } from 'lucide-react';
import { GolfCourse } from './types';

interface GolfCourseCardProps {
  course: GolfCourse;
  onEdit: (course: GolfCourse) => void;
}

const GolfCourseCard: React.FC<GolfCourseCardProps> = ({ course, onEdit }) => {
  const handleCardClick = () => {
    onEdit(course);
  };

  // Check for GB&I countries - including all possible variations
  const isGBI = ['United Kingdom', 'Ireland', 'England', 'Scotland', 'Wales', 'Northern Ireland', 'Isle of Man', 'Britain & Ireland'].includes(course.country);
  const isUSA = ['United States', 'USA'].includes(course.country);
  const isEurope = course.country === 'Continental Europe';

  // Determine regional rank display
  const getRegionalRankBadge = () => {
    if (isGBI && course.regional_rank && course.regional_rank <= 100) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 text-xs">
          {course.regional_rank} GB&I
        </Badge>
      );
    }
    
    if (isUSA && course.usa_rank && course.usa_rank <= 100) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300 text-xs">
          {course.usa_rank} USA
        </Badge>
      );
    }
    
    if (isEurope && course.regional_rank && course.regional_rank <= 100) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
          {course.regional_rank} Continental Europe
        </Badge>
      );
    }
    
    return null;
  };

  // Determine worldwide rank display
  const getWorldwideRankBadge = () => {
    if (course.global_rank && course.global_rank <= 100) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
          {course.global_rank} Worldwide
        </Badge>
      );
    }
    return null;
  };

  const regionalBadge = getRegionalRankBadge();
  const worldwideBadge = getWorldwideRankBadge();

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 relative">
            {course.thumbnail_image ? (
              <div className="relative">
                <img
                  src={course.thumbnail_image}
                  alt={course.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                {/* Regional rank badge on the left */}
                {regionalBadge && (
                  <div className="absolute -top-1 -left-1">
                    {regionalBadge}
                  </div>
                )}
                {/* Worldwide rank badge on the right */}
                {worldwideBadge && (
                  <div className="absolute -top-1 -right-1">
                    {worldwideBadge}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center relative">
                <MapPin className="h-6 w-6 text-muted-foreground" />
                {/* Regional rank badge on the left */}
                {regionalBadge && (
                  <div className="absolute -top-1 -left-1">
                    {regionalBadge}
                  </div>
                )}
                {/* Worldwide rank badge on the right */}
                {worldwideBadge && (
                  <div className="absolute -top-1 -right-1">
                    {worldwideBadge}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{course.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flag className="h-3 w-3" />
              <span>{course.country}</span>
              {course.region && (
                <>
                  <span>•</span>
                  <span>{course.region}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GolfCourseCard;
