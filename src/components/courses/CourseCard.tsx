
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Trophy, Star, Check, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  name: string;
  country: string;
  region: string;
  continent: string;
  global_rank: number | null;
  regional_rank: number | null;
  description: string;
  thumbnail_image: string;
  latitude: number | null;
  longitude: number | null;
}

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = useState(false);

  // Check if user has played this course
  const { data: userCourse } = useQuery({
    queryKey: ['user-course', course.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_courses')
        .select('*')
        .eq('course_id', course.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const togglePlayedMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (userCourse) {
        // Update existing record
        const { error } = await supabase
          .from('user_courses')
          .update({ played: !userCourse.played })
          .eq('id', userCourse.id);
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('user_courses')
          .insert({
            course_id: course.id,
            user_id: user.id,
            played: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-course', course.id] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      toast({
        title: userCourse?.played ? "Removed from played courses" : "Added to played courses",
        description: userCourse?.played 
          ? `${course.name} removed from your played courses`
          : `${course.name} marked as played`,
      });
    },
    onError: (error) => {
      console.error('Error updating course status:', error);
      toast({
        title: "Error",
        description: "Failed to update course status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTogglePlayed = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePlayedMutation.mutate();
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <div className="h-48 overflow-hidden">
          <img
            src={course.thumbnail_image || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'}
            alt={course.name}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isHovered ? 'scale-105' : 'scale-100'
            }`}
          />
        </div>
        
        {/* Rank badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {course.global_rank && (
            <Badge className="bg-yellow-500 text-yellow-900 hover:bg-yellow-500">
              <Trophy className="h-3 w-3 mr-1" />
              #{course.global_rank}
            </Badge>
          )}
          {course.regional_rank && (
            <Badge variant="secondary">
              Regional #{course.regional_rank}
            </Badge>
          )}
        </div>

        {/* Played status button */}
        <div className="absolute top-3 right-3">
          <Button
            size="sm"
            variant={userCourse?.played ? "default" : "secondary"}
            onClick={handleTogglePlayed}
            disabled={togglePlayedMutation.isPending}
            className="shadow-lg"
          >
            {userCourse?.played ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Played
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
              {course.name}
            </h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{course.region ? `${course.region}, ` : ''}{course.country}</span>
            </div>
          </div>

          {course.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {course.description}
            </p>
          )}

          {userCourse?.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{userCourse.rating}/5</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
