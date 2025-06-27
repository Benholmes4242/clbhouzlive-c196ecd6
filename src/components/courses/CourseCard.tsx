
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Star } from 'lucide-react';
import CourseImage from './CourseImage';
import CourseRankBadges from './CourseRankBadges';
import CoursePlayedButton from './CoursePlayedButton';

interface Course {
  id: string;
  name: string;
  country: string;
  sub_country?: string;
  region?: string;
  global_rank?: number;
  regional_rank?: number;
  country_rank?: number;
  usa_rank?: number;
  description?: string;
  thumbnail_image?: string;
  website_url?: string;
  latitude?: number;
  longitude?: number;
}

interface CourseCardProps {
  course: Course;
  viewContext: 'global' | 'regional' | 'usa' | 'europe';
  showPlayedButton?: boolean;
  onCourseSelect?: (course: Course) => void;
  viewingUserId?: string;
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

const CourseCard = ({ course, viewContext, showPlayedButton = true, onCourseSelect, viewingUserId }: CourseCardProps) => {
  const handleCardClick = () => {
    if (onCourseSelect) {
      onCourseSelect(course);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={handleCardClick}>
      <div className="aspect-video relative">
        <CourseImage 
          thumbnailImage={course.thumbnail_image || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'}
          name={course.name}
          isHovered={false}
        />
        <CourseRankBadges 
          globalRank={course.global_rank}
          regionalRank={course.regional_rank}
          usaRank={course.usa_rank}
          country={course.country}
          viewContext={viewContext}
        />
        {showPlayedButton && (
          <CoursePlayedButton 
            courseId={course.id}
            courseName={course.name}
            userCourse={null}
            canModifyCourseStatus={true}
            viewingUserId={viewingUserId}
            course={course}
          />
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg mb-1">{course.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{course.sub_country}, {course.country}</span>
            </div>
          </div>

          {course.description && (
            <div className="text-sm text-muted-foreground line-clamp-3">
              {formatDescription(course.description)}
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {course.global_rank && (
              <Badge variant="secondary" className="text-xs">
                Global #{course.global_rank}
              </Badge>
            )}
            {course.regional_rank && (
              <Badge variant="outline" className="text-xs">
                Regional #{course.regional_rank}
              </Badge>
            )}
            {course.country_rank && (
              <Badge variant="outline" className="text-xs">
                Country #{course.country_rank}
              </Badge>
            )}
            {course.usa_rank && (
              <Badge variant="outline" className="text-xs">
                USA #{course.usa_rank}
              </Badge>
            )}
          </div>

          {course.website_url && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Website: </span>
              <a 
                href={course.website_url.startsWith('http') ? course.website_url : `https://${course.website_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {course.website_url}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
