
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Star, User, Calendar, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region: string;
  continent: string;
  global_rank: number | null;
  regional_rank: number | null;
  description: string | null;
  thumbnail_image: string | null;
  website_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface CourseRating {
  id: string;
  rating: number;
  review: string | null;
  review_date: string;
  user_id: string;
  user_profiles: {
    username: string | null;
    display_name: string | null;
  } | null;
}

interface GolfCourseEditorProps {
  course: GolfCourse | null;
  isCreating: boolean;
  onClose: () => void;
}

const continentOptions = [
  'North America',
  'South America',
  'Europe',
  'Asia',
  'Africa',
  'Oceania'
];

const GolfCourseEditor: React.FC<GolfCourseEditorProps> = ({ course, isCreating, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, reset } = useForm();

  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);

  // Fetch course ratings/reviews
  const { data: ratings, isLoading: ratingsLoading } = useQuery({
    queryKey: ['course-ratings', course?.id],
    queryFn: async () => {
      if (!course?.id) return [];
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select(`
          *,
          user_profiles:user_id (
            username,
            display_name
          )
        `)
        .eq('course_id', course.id)
        .order('review_date', { ascending: false });

      if (error) throw error;
      return data as CourseRating[];
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
      setDeleteReviewId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete review: ${error.message}`,
        variant: "destructive",
      });
      setDeleteReviewId(null);
    },
  });

  const onSubmit = (data: any) => {
    saveMutation.mutate(data);
  };

  const handleDeleteReview = (reviewId: string) => {
    deleteReviewMutation.mutate(reviewId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Golf Course Name *</Label>
              <Input
                id="name"
                {...register('name', { required: true })}
                placeholder="Enter course name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                {...register('country', { required: true })}
                placeholder="Enter country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                {...register('region')}
                placeholder="Enter region/state"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="continent">Continent *</Label>
              <Select onValueChange={(value) => setValue('continent', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select continent" />
                </SelectTrigger>
                <SelectContent>
                  {continentOptions.map((continent) => (
                    <SelectItem key={continent} value={continent}>
                      {continent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="global_rank">Global Rank</Label>
              <Input
                id="global_rank"
                type="number"
                {...register('global_rank')}
                placeholder="Enter global ranking"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="regional_rank">Regional Rank</Label>
              <Input
                id="regional_rank"
                type="number"
                {...register('regional_rank')}
                placeholder="Enter regional ranking"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                {...register('latitude')}
                placeholder="Enter latitude"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                {...register('longitude')}
                placeholder="Enter longitude"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail_image">Course Image URL</Label>
            <Input
              id="thumbnail_image"
              {...register('thumbnail_image')}
              placeholder="Enter image URL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              {...register('website_url')}
              placeholder="Enter website URL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter course description..."
              rows={4}
            />
          </div>

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
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Course Reviews</h3>
            
            {ratingsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : ratings && ratings.length > 0 ? (
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <Card key={rating.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {rating.user_profiles?.display_name || 
                               rating.user_profiles?.username || 
                               'Anonymous User'}
                            </span>
                            <div className="flex items-center gap-1">
                              {renderStars(rating.rating)}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(rating.review_date)}</span>
                            </div>
                          </div>
                          {rating.review && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {rating.review}
                            </p>
                          )}
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                Delete Review
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this review? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteReview(rating.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Review
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                  <p className="text-muted-foreground">This course hasn't received any reviews from users.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GolfCourseEditor;
