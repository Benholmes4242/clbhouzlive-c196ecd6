
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Users } from 'lucide-react';
import CourseImage from './CourseImage';
import CourseRankBadges from './CourseRankBadges';
import CoursePlayedButton from './CoursePlayedButton';
import CourseDetailModal from './CourseDetailModal';

interface Course {
  id: string;
  name: string;
  country: string;
  region: string;
  continent: string;
  global_rank: number | null;
  regional_rank: number | null;
  usa_rank: number | null;
  description: string;
  thumbnail_image: string;
  latitude: number | null;
  longitude: number | null;
  website_url: string | null;
}

interface CourseCardProps {
  course: Course;
  viewContext?: 'global' | 'regional';
  viewingUserId?: string;
}

const CourseCard = ({ course, viewContext = 'global', viewingUserId }: CourseCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card 
        className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-border/50" 
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative overflow-hidden">
          <CourseImage 
            src={course.thumbnail_image} 
            alt={course.name}
            className="aspect-[4/3] w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <CourseRankBadges course={course} viewContext={viewContext} />
          </div>
        </div>
        
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
              {course.name}
            </h3>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
              <MapPin className="h-3 w-3" />
              <span>{course.region}, {course.country}</span>
            </div>
          </div>

          {viewingUserId && (
            <div className="pt-2" onClick={(e) => e.stopPropagation()}>
              <CoursePlayedButton 
                courseId={course.id} 
                userId={viewingUserId}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <CourseDetailModal
        course={course}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default CourseCard;
