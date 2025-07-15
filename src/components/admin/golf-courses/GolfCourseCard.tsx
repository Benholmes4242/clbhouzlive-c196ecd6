
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Flag } from 'lucide-react';
import { GolfCourse } from './types';

interface GolfCourseCardProps {
  course: GolfCourse;
  onEdit: (course: GolfCourse) => void;
}

// Helper function to format description text with line breaks
const formatDescription = (description: string) => {
  return description
    .split('\n')
    .map((line, index, array) => (
      <span key={`desc-line-${index}`}>
        {line}
        {index < array.length - 1 && <br />}
      </span>
    ));
};

// Helper function to format location display
const formatLocation = (course: GolfCourse) => {
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

const GolfCourseCard: React.FC<GolfCourseCardProps> = ({ course, onEdit }) => {
  const handleCardClick = () => {
    onEdit(course);
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {course.thumbnail_image ? (
              <img
                src={course.thumbnail_image}
                alt={course.name}
                className="w-48 h-36 rounded-lg object-cover border shadow-sm"
              />
            ) : (
              <div className="w-48 h-36 rounded-lg bg-muted flex items-center justify-center border">
                <MapPin className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-2">{course.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Flag className="h-4 w-4" />
              <span>{formatLocation(course)}</span>
            </div>
            {course.description && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {formatDescription(course.description)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GolfCourseCard;
