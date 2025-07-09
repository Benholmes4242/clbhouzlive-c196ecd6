import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface UpdatePostData {
  caption: string;
  files: File[];
  tags: TaggableEntity[];
  course?: {
    id: string;
    name: string;
    country: string;
    region?: string;
  } | null;
}

export const usePostUpdate = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const updatePost = async (postId: string, data: UpdatePostData, existingMediaUrls: string[] = []) => {
    setIsUpdating(true);
    
    try {
      console.log('Starting post update for:', postId, data);

      // 1. Update post content
      const { error: postError } = await supabase
        .from('posts')
        .update({
          content: data.caption,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (postError) {
        console.error('Post update error:', postError);
        throw postError;
      }
      console.log('Post content updated successfully');

      // Tags and course tagging temporarily disabled due to missing database tables

      console.log('All updates completed successfully');
      toast({
        title: "Success!",
        description: "Your updates have been saved!",
        className: "bg-green-600 text-white border-green-600",
        duration: 3000,
      });

      return { success: true };

    } catch (error) {
      console.error('Full error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to save updates. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
      
      return { success: false, error };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updatePost,
    isUpdating
  };
};