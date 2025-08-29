import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCloudflareStream } from '@/hooks/useCloudflareStream';
import { useR2Upload } from '@/hooks/useR2Upload';

export const useProfileHandlers = (user: any, onProfileUpdate: () => void) => {
  const { uploadVideo, uploading: videoUploading } = useCloudflareStream();
  const { uploadImage, uploading: photoUploading } = useR2Upload();

  const handleVideoUpload = async (file: File) => {
    try {
      const result = await uploadVideo(file);
      
      if (!result.success) {
        toast.error(result.error || "Failed to upload video");
        return;
      }

      // Update profile with video URLs
      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_video_url: result.videoUrl,
          profile_video_thumbnail_url: result.thumbnailUrl,
          has_profile_video: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      toast.success("Profile video uploaded successfully!");

      onProfileUpdate();
    } catch (error) {
      console.error('Error updating profile video:', error);
      toast.error("Failed to save video to profile");
    }
  };

  const handleVideoRemove = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_video_url: null,
          profile_video_thumbnail_url: null,
          has_profile_video: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      toast.success("Profile video removed successfully!");

      onProfileUpdate();
    } catch (error) {
      console.error('Error removing profile video:', error);
      toast.error("Failed to remove video from profile");
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      const result = await uploadImage(file);
      
      if (!result.success) {
        toast.error(result.error || "Failed to upload photo");
        return;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_photo_url: result.imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      toast.success("Profile photo updated successfully!");

      onProfileUpdate();
    } catch (error) {
      console.error('Error updating profile photo:', error);
      toast.error("Failed to save photo to profile");
    }
  };

  const handleMorphTransition = () => {
    // Handle morph transition logic
    console.log('Morph transition triggered');
  };

  return {
    handleVideoUpload,
    handleVideoRemove,
    handlePhotoUpload,
    handleMorphTransition,
    videoUploading,
    photoUploading
  };
};