import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { uploadToCloudflareR2 } from '@/utils/cloudflareUpload';

interface Course {
  id: string;
  name: string;
  thumbnail_image?: string;
}

interface AddToPlayedModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddToPlayedModal = ({ course, isOpen, onClose, onSuccess }: AddToPlayedModalProps) => {
  const { toast } = useToast();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  
  const [rating, setRating] = useState<number[]>([7]);
  const [review, setReview] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPlayedCourse = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      // First, mark course as played
      const { error: courseError } = await supabase
        .from('user_courses')
        .upsert({
          course_id: course.id,
          user_id: user.id,
          played: true,
          played_date: new Date().toISOString().split('T')[0],
        });

      if (courseError) throw courseError;

      // Check if it's a Top 100 course and add to tracker
      const { data: courseData } = await supabase
        .from('golf_courses')
        .select('global_rank, regional_rank, usa_rank')
        .eq('id', course.id)
        .single();

      if (courseData?.global_rank || courseData?.regional_rank || courseData?.usa_rank) {
        const { error: top100Error } = await supabase
          .from('user_top100_courses')
          .upsert({
            course_id: course.id,
            user_id: user.id,
            played: true,
            played_date: new Date().toISOString().split('T')[0],
          });
        if (top100Error) throw top100Error;
      }

      // Add rating and review
      const { data: ratingData, error: ratingError } = await supabase
        .from('course_ratings')
        .upsert({
          course_id: course.id,
          user_id: user.id,
          rating: rating[0],
          review: review.trim() || null,
          review_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (ratingError) throw ratingError;

      // Upload media files if any
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          // Upload to Cloudflare R2 instead of Supabase storage
          const uploadResult = await uploadToCloudflareR2(file, 'clbhouz-review-images', file.name);
          
          if (!uploadResult.success || !uploadResult.publicUrl) {
            throw new Error(uploadResult.error || 'Upload failed');
          }

          // Save media record
          await supabase
            .from('course_review_media')
            .insert({
              review_id: ratingData.id,
              media_url: uploadResult.publicUrl,
              media_type: file.type.startsWith('video/') ? 'video' : 'image',
              file_name: file.name,
              file_size: file.size,
            });
        }
      }

      // Trigger badge checking
      try {
        await supabase.rpc('check_and_award_badges', { user_id_param: user.id });
      } catch (error) {
        console.error('Error checking badges:', error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-course'] });
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-top100-course'] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      
      toast({
        title: "Course added to played!",
        description: `${course.name} has been added to your played courses.`,
      });
      
      onSuccess();
      onClose();
      setRating([7]);
      setReview('');
      setUploadedFiles([]);
    },
    onError: (error) => {
      console.error('Error adding course:', error);
      toast({
        title: "Error",
        description: "Failed to add course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await submitPlayedCourse.mutateAsync();
    setIsSubmitting(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      // No size limit - users can upload files of any size
      return (isImage || isVideo);
    });
    
    setUploadedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {course.name} to Played</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Rating */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Rating</Label>
            <div className="space-y-2">
              <div className="relative flex w-full touch-none select-none items-center">
                <div className="relative h-2 w-full grow overflow-hidden rounded-full" style={{ backgroundColor: '#FFE8D1' }}>
                  <div 
                    className="absolute h-full rounded-full transition-all" 
                    style={{ 
                      backgroundColor: '#F5A623',
                      width: `${(rating[0] / 10) * 100}%`
                    }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={rating[0]}
                  onChange={(e) => setRating([parseFloat(e.target.value)])}
                  className="absolute w-full h-2 opacity-0 cursor-pointer"
                />
                <div 
                  className="absolute block h-5 w-5 rounded-full border-2 bg-background transition-colors"
                  style={{ 
                    borderColor: '#F5A623',
                    left: `calc(${(rating[0] / 10) * 100}% - 10px)`
                  }}
                />
              </div>
              <div className="text-center text-2xl font-bold" style={{ color: '#F5A623' }}>
                {rating[0]}
              </div>
            </div>
          </div>

          {/* Review */}
          <div className="space-y-3">
            <Label htmlFor="review" className="text-base font-medium">Review</Label>
            <Textarea
              id="review"
              placeholder="Write your review..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Media Upload */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Photos & Videos (Optional)</Label>
            <div className="space-y-3">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <label htmlFor="media-upload" className="cursor-pointer block text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload photos or videos
                  </span>
                  <input
                    id="media-upload"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            className="w-full bg-muted hover:bg-muted/80 active:bg-muted/60 text-muted-foreground hover:text-foreground transition-all duration-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding Course...' : 'Add to Played'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToPlayedModal;