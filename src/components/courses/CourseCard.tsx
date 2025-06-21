
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  country: string;
  region?: string;
  global_rank?: number;
  regional_rank?: number;
  usa_rank?: number;
  description?: string;
  thumbnail_image?: string;
}

interface CourseCardProps {
  course: Course;
  viewContext?: 'global' | 'regional' | 'usa';
}

const CourseCard: React.FC<CourseCardProps> = ({ course, viewContext = 'global' }) => {
  const getRankDisplay = () => {
    if (viewContext === 'regional' && course.regional_rank) {
      return `#${course.regional_rank}`;
    } else if (viewContext === 'usa' && course.usa_rank) {
      return `#${course.usa_rank}`;
    } else if (course.global_rank) {
      return `#${course.global_rank}`;
    }
    return null;
  };

  const getRankLabel = () => {
    if (viewContext === 'regional') {
      return 'GB&I';
    } else if (viewContext === 'usa') {
      return 'USA';
    }
    return 'Global';
  };

  const rank = getRankDisplay();

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden">
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
        {rank && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 bg-white/90 text-gray-900 font-semibold"
          >
            {rank} {getRankLabel()}
          </Badge>
        )}
        {course.global_rank && course.global_rank <= 100 && (
          <Badge 
            variant="default" 
            className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600 text-white"
          >
            Top 100
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {course.name}
        </h3>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {course.region && course.region !== course.country 
              ? `${course.region}, ${course.country}`
              : course.country
            }
          </span>
        </div>
        
        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {course.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseCard;
