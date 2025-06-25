
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
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedSubCountry, setSelectedSubCountry] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('');
  const [courseImageUrl, setCourseImageUrl] = useState<string | null>(null);
  
  // New state for Top 100s section
  const [regionalRankingRegion, setRegionalRankingRegion] = useState('');
  const [regionalRank, setRegionalRank] = useState('');
  const [globalRank, setGlobalRank] = useState('');

  // Fetch course ratings/reviews
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
        sub_country: course.sub_country || '',
        region: course.region || '',
        continent: course.continent || '',
        description: course.description || '',
        website_url: course.website_url || '',
        latitude: course.latitude || '',
        longitude: course.longitude || '',
      });
      setSelectedCountry(course.country);
      setSelectedSubCountry(course.sub_country || '');
      setSelectedContinent(course.continent || '');
      setCourseImageUrl(course.thumbnail_image || null);
      
      // Set Top 100s values
      if (course.regional_rank) {
        setRegionalRank(course.regional_rank.toString());
        // Map country to regional ranking region
        if (course.country === 'Britain & Ireland') {
          setRegionalRankingRegion('Great Britain and Ireland');
        } else if (course.country === 'USA') {
          setRegionalRankingRegion('USA');
        } else if (course.country === 'Continental Europe') {
          setRegionalRankingRegion('Continental Europe');
        }
      }
      
      if (course.global_rank) {
        setGlobalRank(course.global_rank.toString());
      }
    } else {
      reset({
        name: '',
        country: '',
        sub_country: '',
        region: '',
        continent: '',
        description: '',
        website_url: '',
        latitude: '',
        longitude: '',
      });
      setSelectedCountry('');
      setSelectedSubCountry('');
      setSelectedContinent('');
      setCourseImageUrl(null);
      setRegionalRankingRegion('');
      setRegionalRank('');
      setGlobalRank('');
    }
  }, [course, isCreating, reset]);

  // Save course mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Saving course with data:', data);
      console.log('Selected country:', selectedCountry);
      console.log('Selected sub-country:', selectedSubCountry);
      console.log('Course image URL:', courseImageUrl);
      console.log('Regional ranking region:', regionalRankingRegion);
      console.log('Regional rank:', regionalRank);
      console.log('Global rank:', globalRank);
      
      const courseData = {
        name: data.name,
        country: selectedCountry,
        sub_country: selectedSubCountry || null,
        region: data.region || null,
        continent: selectedContinent as "North America" | "South America" | "Europe" | "Asia" | "Africa" | "Oceania" | null,
        global_rank: globalRank ? parseInt(globalRank) : null,
        regional_rank: regionalRank ? parseInt(regionalRank) : null,
        country_rank: null, // Removed from UI
        description: data.description || null,
        thumbnail_image: courseImageUrl || null,
        website_url: data.website_url || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
      };

      console.log('Final course data to save:', courseData);

      if (isCreating) {
        const { data: result, error } = await supabase
          .from('golf_courses')
          .insert(courseData)
          .select()
          .single();
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('golf_courses')
          .update(courseData)
          .eq('id', course!.id)
          .select()
          .single();
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
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
    onError: (error: any) => {
      console.error('Save mutation error:', error);
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
    console.log('Form submitted with data:', data);
    console.log('Current selectedCountry:', selectedCountry);
    console.log('Current selectedSubCountry:', selectedSubCountry);
    
    // Validate required fields
    if (!data.name || data.name.trim() === '') {
      toast({
        title: "Error",
        description: "Please enter a golf course name",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCountry || selectedCountry.trim() === '') {
      toast({
        title: "Error",
        description: "Please select a country/region",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSubCountry || selectedSubCountry.trim() === '') {
      toast({
        title: "Error",
        description: "Please select a sub-country",
        variant: "destructive",
      });
      return;
    }

    // Validate Top 100s rankings
    if (regionalRankingRegion && !regionalRank) {
      toast({
        title: "Error",
        description: "Please select a rank for the regional Top 100",
        variant: "destructive",
      });
      return;
    }

    // All validation passed, proceed with save
    saveMutation.mutate(data);
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
            selectedSubCountry={selectedSubCountry}
            setSelectedSubCountry={setSelectedSubCountry}
            selectedContinent={selectedContinent}
            setSelectedContinent={setSelectedContinent}
            errors={errors}
            currentImageUrl={courseImageUrl}
            onImageChange={setCourseImageUrl}
            regionalRankingRegion={regionalRankingRegion}
            setRegionalRankingRegion={setRegionalRankingRegion}
            regionalRank={regionalRank}
            setRegionalRank={setRegionalRank}
            globalRank={globalRank}
            setGlobalRank={setGlobalRank}
          />

          <div className="flex gap-3 pt-4 border-t">
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
