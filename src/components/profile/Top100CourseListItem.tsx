
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface Top100CourseListItemProps {
  course: any;
  isPlayed: boolean;
  isOwnProfile: boolean;
  onToggle: (courseId: string) => void;
  region?: string;
}

const Top100CourseListItem: React.FC<Top100CourseListItemProps> = ({
  course,
  isPlayed,
  isOwnProfile,
  onToggle,
  region
}) => {
  // Determine which rank to display based on the region
  const getRankNumber = () => {
    if (region === 'britain-ireland' && course.regional_rank) {
      return course.regional_rank;
    } else if (region === 'usa' && course.usa_rank) {
      return course.usa_rank;
    } else if (course.global_rank) {
      return course.global_rank;
    }
    return null;
  };

  const rankNumber = getRankNumber();

  return (
    <div
      className={`flex items-center space-x-3 p-3 rounded-lg border ${
        isPlayed ? 'bg-green-50 border-green-200' : 'hover:bg-muted/50'
      } ${isOwnProfile ? 'cursor-pointer' : ''}`}
      onClick={() => isOwnProfile && onToggle(course.id)}
    >
      <Checkbox
        checked={isPlayed}
        onCheckedChange={() => onToggle(course.id)}
        className="flex-shrink-0"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {rankNumber && (
            <span className="text-sm font-medium text-muted-foreground">
              {rankNumber}
            </span>
          )}
          <h3 className="font-semibold truncate">{course.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {course.region}, {course.country}
        </p>
        {course.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {course.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default Top100CourseListItem;
