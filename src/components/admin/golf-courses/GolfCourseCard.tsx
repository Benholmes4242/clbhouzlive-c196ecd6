
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Edit, Star } from 'lucide-react';
import { GolfCourse } from './types';

interface GolfCourseCardProps {
  course: GolfCourse;
  onEdit: (course: GolfCourse) => void;
}

const formatDescription = (description: string) => {
  if (!description) return null;
  
  return description.split('\n').map((paragraph, index) => {
    if (paragraph.trim() === '') return null;
    return (
      <p key={index} className="mb-2 last:mb-0">
        {paragraph.trim()}
      </p>
    );
  }).filter(Boolean);
};

const GolfCourseCard = ({ course, onEdit }: GolfCourseCardProps) => {
  const handleEdit = () => {
    onEdit(course);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-2">{course.name}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{course.city}, {course.state}</span>
              {course.country && course.country !== 'United States' && (
                <span>, {course.country}</span>
              )}
            </div>
            {course.rating && (
              <div className="flex items-center mb-2">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-sm font-medium">{course.rating}/5</span>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="ml-4"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {course.description && (
            <div className="text-sm text-muted-foreground">
              {formatDescription(course.description)}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {course.course_type && (
              <Badge variant="secondary">{course.course_type}</Badge>
            )}
            {course.holes && (
              <Badge variant="outline">{course.holes} holes</Badge>
            )}
            {course.par && (
              <Badge variant="outline">Par {course.par}</Badge>
            )}
            {course.yardage && (
              <Badge variant="outline">{course.yardage} yards</Badge>
            )}
          </div>

          {course.website && (
            <div className="text-sm">
              <span className="font-medium">Website: </span>
              <a 
                href={course.website.startsWith('http') ? course.website : `https://${course.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {course.website}
              </a>
            </div>
          )}

          {course.phone && (
            <div className="text-sm">
              <span className="font-medium">Phone: </span>
              <a href={`tel:${course.phone}`} className="text-blue-600 hover:underline">
                {course.phone}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GolfCourseCard;
