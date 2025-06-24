
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Flag } from 'lucide-react';
import { GolfCourse } from './types';

interface GolfCourseCardProps {
  course: GolfCourse;
  onEdit: (course: GolfCourse) => void;
}

const GolfCourseCard: React.FC<GolfCourseCardProps> = ({ course, onEdit }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {course.thumbnail_image ? (
                <img
                  src={course.thumbnail_image}
                  alt={course.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
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
              <div className="flex items-center gap-4 mt-2">
                {course.global_rank && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Global Rank: #{course.global_rank}
                  </span>
                )}
                {course.regional_rank && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Regional Rank: #{course.regional_rank}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => onEdit(course)}
          >
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GolfCourseCard;
