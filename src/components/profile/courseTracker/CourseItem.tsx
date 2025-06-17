
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Course = {
  id: string;
  name: string;
  country: string;
  region: string;
  global_rank: number;
};

interface CourseItemProps {
  course: Course;
  isPlayed: boolean;
  onToggle: (courseId: string, checked: boolean) => void;
}

const CourseItem: React.FC<CourseItemProps> = ({
  course,
  isPlayed,
  onToggle
}) => {
  return (
    <div 
      className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onToggle(course.id, !isPlayed)}
    >
      <Checkbox
        id={`course-${course.id}`}
        checked={isPlayed}
        onCheckedChange={(checked) => 
          onToggle(course.id, checked as boolean)
        }
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1">
        <Label 
          htmlFor={`course-${course.id}`}
          className="text-sm font-medium cursor-pointer"
        >
          #{course.global_rank} {course.name}
        </Label>
        <p className="text-xs text-muted-foreground">
          {course.region}, {course.country}
        </p>
      </div>
    </div>
  );
};

export default CourseItem;
