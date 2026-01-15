import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook for uploading avatar and cover images for creator pages.
 * Mirrors useBusinessImageUpload pattern for consistency.
 */
export function useCreatorImageUpload(creatorPageId: string | undefined) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const queryClient = useQueryClient();

  const invalidateCreatorQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['creator-page'] }),
      queryClient.invalidateQueries({ queryKey: ['my-creators'] }),
    ]);
  }, [queryClient]);

  const uploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    if (!creatorPageId) return null;
    
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${creatorPageId}/avatar-${Date.now()}.${fileExt}`;
      
      const uploadResult = await uploadToR2Only(file, 'clbhouz-club-logos', fileName);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Avatar upload failed');
      }

      const { error } = await supabase
        .from('creator_pages')
        .update({ avatar_url: uploadResult.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', creatorPageId);

      if (error) throw error;

      await invalidateCreatorQueries();
      toast.success('Avatar updated');
      
      return uploadResult.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  }, [creatorPageId, invalidateCreatorQueries]);

  const removeAvatar = useCallback(async () => {
    if (!creatorPageId) return;
    
    try {
      const { error } = await supabase
        .from('creator_pages')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', creatorPageId);

      if (error) throw error;

      await invalidateCreatorQueries();
      toast.success('Avatar removed');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove avatar');
    }
  }, [creatorPageId, invalidateCreatorQueries]);

  const uploadCover = useCallback(async (file: File): Promise<string | null> => {
    if (!creatorPageId) return null;
    
    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${creatorPageId}/cover-${Date.now()}.${fileExt}`;
      
      const uploadResult = await uploadToR2Only(file, 'clbhouz-profile-banners', fileName);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Cover upload failed');
      }

      const { error } = await supabase
        .from('creator_pages')
        .update({ cover_url: uploadResult.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', creatorPageId);

      if (error) throw error;

      await invalidateCreatorQueries();
      toast.success('Cover photo updated');
      
      return uploadResult.publicUrl;
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Failed to upload cover photo');
      return null;
    } finally {
      setUploadingCover(false);
    }
  }, [creatorPageId, invalidateCreatorQueries]);

  const removeCover = useCallback(async () => {
    if (!creatorPageId) return;
    
    try {
      const { error } = await supabase
        .from('creator_pages')
        .update({ cover_url: null, updated_at: new Date().toISOString() })
        .eq('id', creatorPageId);

      if (error) throw error;

      await invalidateCreatorQueries();
      toast.success('Cover photo removed');
    } catch (error) {
      console.error('Error removing cover:', error);
      toast.error('Failed to remove cover photo');
    }
  }, [creatorPageId, invalidateCreatorQueries]);

  return {
    uploadAvatar,
    removeAvatar,
    uploadCover,
    removeCover,
    uploadingAvatar,
    uploadingCover,
  };
}

/**
 * Standalone upload function for use during creator page creation (before ID exists)
 */
export async function uploadCreatorImage(file: File, type: 'avatar' | 'cover', tempId: string): Promise<string | null> {
  try {
    const { uploadToR2Only } = await import('@/utils/r2OnlyUpload');
    const fileExt = file.name.split('.').pop();
    const bucket = type === 'avatar' ? 'clbhouz-club-logos' : 'clbhouz-profile-banners';
    const fileName = `creator-${tempId}/${type}-${Date.now()}.${fileExt}`;
    
    const uploadResult = await uploadToR2Only(file, bucket, fileName);
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || `${type} upload failed`);
    }

    return uploadResult.publicUrl;
  } catch (error) {
    console.error(`Error uploading ${type}:`, error);
    return null;
  }
}