import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CourseRankBadges from './CourseRankBadges';

interface Course {
  id: string;
  name: string;
  country: string;
  region?: string;
  sub_country?: string;
  continent?: string;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
  description?: string;
  thumbnail_image?: string;
  latitude?: number | null;
  longitude?: number | null;
  website_url?: string | null;
}

interface CourseCardProps {
  course: Course;
  viewContext?: 'global' | 'regional' | 'usa' | 'europe';
  viewingUserId?: string;
  userRating?: number | null;
  isReadOnly?: boolean;
  showUserRating?: boolean;
  isFromUserCoursesPage?: boolean;
}

// Helper function to format description text with line breaks
const formatDescription = (description: string) => {
  return (
    <span>
      {description
        .split('\n')
        .map((line, index, array) => (
          <React.Fragment key={index}>
            {line}
            {index < array.length - 1 && <br />}
          </React.Fragment>
        ))}
    </span>
  );
};

const formatLocation = (course: Course) => {
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

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  viewContext = 'global', 
  viewingUserId,
  userRating,
  isReadOnly = false,
  showUserRating = false,
  isFromUserCoursesPage = false
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/courses/${course.id}`);
  };

  return (
    <>
      <Card 
        className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden relative"
        onClick={handleCardClick}
      >
        <div className="relative">
          <div className="aspect-video bg-muted overflow-hidden">
            {course.thumbnail_image ? (
              <img
                src={course.thumbnail_image}
                alt={course.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                <Star className="h-12 w-12 text-white opacity-50" />
              </div>
            )}
          </div>
          
          {/* Ranking badges - positioned relative to the outer container */}
          <CourseRankBadges
            globalRank={course.global_rank}
            regionalRank={course.regional_rank}
            usaRank={course.usa_rank}
            country={course.country}
            viewContext={viewContext}
            userRating={userRating}
            showUserRating={showUserRating}
            positioning="bottom-left"
          />
        </div>
        
        <CardHeader className="pb-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-[#b66b41] transition-colors">
            {course.name}
          </h3>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {formatLocation(course)}
            </span>
          </div>
          
          {course.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {formatDescription(course.description)}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default CourseCard;
