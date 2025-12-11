import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function useBusinessImageUpload(businessId: string | undefined) {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const queryClient = useQueryClient();

  const uploadLogo = useCallback(async (file: File) => {
    if (!businessId) return;
    
    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${businessId}/logo-${Date.now()}.${fileExt}`;
      
      const uploadResult = await uploadToR2Only(file, 'clbhouz-club-logos', fileName);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Logo upload failed');
      }

      const { error } = await supabase
        .from('business_accounts')
        .update({ logo_url: uploadResult.publicUrl })
        .eq('id', businessId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['business-profile', businessId] });
      toast.success('Logo updated');
      
      return uploadResult.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
      return null;
    } finally {
      setUploadingLogo(false);
    }
  }, [businessId, queryClient]);

  const removeLogo = useCallback(async () => {
    if (!businessId) return;
    
    try {
      const { error } = await supabase
        .from('business_accounts')
        .update({ logo_url: null })
        .eq('id', businessId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['business-profile', businessId] });
      toast.success('Logo removed');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Failed to remove logo');
    }
  }, [businessId, queryClient]);

  const uploadCover = useCallback(async (file: File) => {
    if (!businessId) return;
    
    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${businessId}/cover-${Date.now()}.${fileExt}`;
      
      // Use profile-banners bucket for cover images
      const uploadResult = await uploadToR2Only(file, 'clbhouz-profile-banners', fileName);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Cover upload failed');
      }

      const { error } = await supabase
        .from('business_accounts')
        .update({ cover_image_url: uploadResult.publicUrl })
        .eq('id', businessId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['business-profile', businessId] });
      toast.success('Cover photo updated');
      
      return uploadResult.publicUrl;
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Failed to upload cover photo');
      return null;
    } finally {
      setUploadingCover(false);
    }
  }, [businessId, queryClient]);

  const removeCover = useCallback(async () => {
    if (!businessId) return;
    
    try {
      const { error } = await supabase
        .from('business_accounts')
        .update({ cover_image_url: null })
        .eq('id', businessId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['business-profile', businessId] });
      toast.success('Cover photo removed');
    } catch (error) {
      console.error('Error removing cover:', error);
      toast.error('Failed to remove cover photo');
    }
  }, [businessId, queryClient]);

  return {
    uploadLogo,
    removeLogo,
    uploadCover,
    removeCover,
    uploadingLogo,
    uploadingCover,
  };
}
