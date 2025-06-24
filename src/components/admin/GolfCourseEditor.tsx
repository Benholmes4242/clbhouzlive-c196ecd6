
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import GolfCourseForm from './golf-courses/GolfCourseForm';
import CourseReviewsSection from './golf-courses/CourseReviewsSection';
import { GolfCourse, CourseRating, GolfCourseEditorProps } from './golf-courses/types';

const GolfCourseEditor: React.FC<GolfCourseEditorProps> = ({ course, isCreating, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegionalRank, setSelectedRegionalRank] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('');

  // Fetch course ratings/reviews with a simpler query structure
  const { data: ratings, isLoading: ratingsLoading } = useQuery({
    queryKey: ['course-ratings', course?.id],
    queryFn: async () => {
      if (!course?.id) return [];
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select('*')
        .eq('course_id', course.id)
        .order('review_date', { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately to avoid relation issues
      const ratingsWithProfiles = await Promise.all(
        (data || []).map(async (rating) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('username, display_name')
            .eq('id', rating.user_id)
            .single();
          
          return {
            ...rating,
            user_profile: profile
          };
        })
      );
      
      return ratingsWithProfiles as CourseRating[];
    },
    enabled: !isCreating && !!course?.id,
  });

  // Initialize form with course data
  useEffect(() => {
    if (course && !isCreating) {
      reset({
        name: course.name,
        country: course.country,
        region: course.region || '',
        continent: course.continent,
        global_rank: course.global_rank || '',
        regional_rank: course.regional_rank || '',
        description: course.description || '',
        thumbnail_image: course.thumbnail_image || '',
        website_url: course.website_url || '',
        latitude: course.latitude || '',
        longitude: course.longitude || '',
      });
      setSelectedCountry(course.country);
      setSelectedContinent(course.continent);
      setSelectedRegionalRank(course.regional_rank?.toString() || '');
    } else {
      reset({
        name: '',
        country: '',
        region: '',
        continent: '',
        global_rank: '',
        regional_rank: '',
        description: '',
        thumbnail_image: '',
        website_url: '',
        latitude: '',
        longitude: '',
      });
      setSelectedCountry('');
      setSelectedContinent('');
      setSelectedRegionalRank('');
    }
  }, [course, isCreating, reset]);

  // Save course mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const courseData = {
        name: data.name,
        country: data.country,
        region: data.region || null,
        continent: data.continent,
        global_rank: data.global_rank ? parseInt(data.global_rank) : null,
        regional_rank: data.regional_rank ? parseInt(data.regional_rank) : null,
        description: data.description || null,
        thumbnail_image: data.thumbnail_image || null,
        website_url: data.website_url || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
      };

      if (isCreating) {
        const { data: result, error } = await supabase
          .from('golf_courses')
          .insert([courseData])
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('golf_courses')
          .update(courseData)
          .eq('id', course!.id)
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: isCreating ? "Golf course created successfully" : "Golf course updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-golf-courses'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isCreating ? 'create' : 'update'} golf course: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('course_ratings')
        .delete()
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Review deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['course-ratings', course?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete review: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (!selectedCountry) {
      toast({
        title: "Error",
        description: "Please select a country",
        variant: "destructive",
      });
      return;
    }

    const formData = {
      ...data,
      country: selectedCountry,
      continent: selectedContinent || null,
      regional_rank: selectedRegionalRank ? parseInt(selectedRegionalRank) : null,
    };
    
    saveMutation.mutate(formData);
  };

  const handleDeleteReview = (reviewId: string) => {
    deleteReviewMutation.mutate(reviewId);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? 'Create New Golf Course' : `Edit ${course?.name}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <GolfCourseForm
            register={register}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            selectedContinent={selectedContinent}
            setSelectedContinent={setSelectedContinent}
            selectedRegionalRank={selectedRegionalRank}
            setSelectedRegionalRank={setSelectedRegionalRank}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : (isCreating ? 'Create Course' : 'Save Changes')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>

        {!isCreating && course && (
          <CourseReviewsSection
            ratings={ratings}
            ratingsLoading={ratingsLoading}
            onDeleteReview={handleDeleteReview}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GolfCourseEditor;
