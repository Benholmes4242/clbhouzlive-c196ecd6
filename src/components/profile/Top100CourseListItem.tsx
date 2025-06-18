
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface Top100CourseListItemProps {
  course: any;
  isPlayed: boolean;
  isOwnProfile: boolean;
  onToggle: (courseId: string) => void;
}

const Top100CourseListItem: React.FC<Top100CourseListItemProps> = ({
  course,
  isPlayed,
  isOwnProfile,
  onToggle
}) => {
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
          {course.regional_rank && (
            <span className="text-sm font-medium text-muted-foreground">
              {course.regional_rank}
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
