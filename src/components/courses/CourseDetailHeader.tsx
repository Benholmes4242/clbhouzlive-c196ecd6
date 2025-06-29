
import React, { useState } from 'react';
import { MapPin, ExternalLink, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import PostPlayRatingModal from './PostPlayRatingModal';

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

interface CourseDetailHeaderProps {
  course: Course;
}

const CourseDetailHeader = ({ course }: CourseDetailHeaderProps) => {
  const { user } = useSupabaseSession();
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Check if user has already played this course
  const { data: userCourse } = useQuery({
    queryKey: ['user-course', course.id, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_courses')
        .select('*')
        .eq('course_id', course.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

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

  const handleAddToPlayed = () => {
    setShowRatingModal(true);
  };

  const isAlreadyPlayed = userCourse?.played;
  const canAddToPlayed = user && !isAlreadyPlayed;

  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">{course.name}</h2>
            <div className="flex items-center gap-1 text-muted-foreground mb-4">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{formatLocation(course)}</span>
            </div>
          </div>
          
          {course.website_url && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="ml-4"
            >
              <a
                href={course.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Website
              </a>
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">About This Course</h3>
          
          {canAddToPlayed && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToPlayed}
              className="flex items-center gap-2 text-green-700 border-green-300 hover:bg-green-50"
            >
              <Target className="h-4 w-4" />
              Add to My Played
            </Button>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      <PostPlayRatingModal
        course={course}
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
      />
    </>
  );
};

export default CourseDetailHeader;
