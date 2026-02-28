import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function useBusinessImageUpload(businessId: string | undefined) {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const queryClient = useQueryClient();

  const invalidateAllBusinessQueries = useCallback(async () => {
    // Invalidate both the specific business profile and the list
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['business-profile', businessId] }),
      queryClient.invalidateQueries({ queryKey: ['my-businesses'] }),
    ]);
  }, [businessId, queryClient]);

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
        .update({ logo_url: uploadResult.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', businessId);

      if (error) throw error;

      // Optimistic update for immediate UI feedback
      queryClient.setQueryData(['business-profile', businessId], (old: any) => 
        old ? { ...old, logo_url: uploadResult.publicUrl } : old
      );

      await invalidateAllBusinessQueries();
      toast.success('Logo updated');
      
      return uploadResult.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error("Couldn't upload logo");
      return null;
    } finally {
      setUploadingLogo(false);
    }
  }, [businessId, queryClient, invalidateAllBusinessQueries]);

  const removeLogo = useCallback(async () => {
    if (!businessId) return;
    
    try {
      const { error } = await supabase
        .from('business_accounts')
        .update({ logo_url: null, updated_at: new Date().toISOString() })
        .eq('id', businessId);

      if (error) throw error;

      // Optimistic update
      queryClient.setQueryData(['business-profile', businessId], (old: any) => 
        old ? { ...old, logo_url: null } : old
      );

      await invalidateAllBusinessQueries();
      toast.success('Logo removed');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error("Couldn't remove logo");
    }
  }, [businessId, queryClient, invalidateAllBusinessQueries]);

  const uploadCover = useCallback(async (file: File) => {
    if (!businessId) return;
    
    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${businessId}/cover-${Date.now()}.${fileExt}`;
      
      const uploadResult = await uploadToR2Only(file, 'clbhouz-profile-banners', fileName);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Cover upload failed');
      }

      const { error } = await supabase
        .from('business_accounts')
        .update({ cover_image_url: uploadResult.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', businessId);

      if (error) throw error;

      // Optimistic update for immediate UI feedback
      queryClient.setQueryData(['business-profile', businessId], (old: any) => 
        old ? { ...old, cover_image_url: uploadResult.publicUrl } : old
      );

      await invalidateAllBusinessQueries();
      toast.success('Cover updated');
      
      return uploadResult.publicUrl;
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error("Couldn't upload cover");
      return null;
    } finally {
      setUploadingCover(false);
    }
  }, [businessId, queryClient, invalidateAllBusinessQueries]);

  const removeCover = useCallback(async () => {
    if (!businessId) return;
    
    try {
      const { error } = await supabase
        .from('business_accounts')
        .update({ cover_image_url: null, updated_at: new Date().toISOString() })
        .eq('id', businessId);

      if (error) throw error;

      // Optimistic update
      queryClient.setQueryData(['business-profile', businessId], (old: any) => 
        old ? { ...old, cover_image_url: null } : old
      );

      await invalidateAllBusinessQueries();
      toast.success('Cover photo removed');
    } catch (error) {
      console.error('Error removing cover:', error);
      toast.error("Couldn't remove cover");
    }
  }, [businessId, queryClient, invalidateAllBusinessQueries]);

  return {
    uploadLogo,
    removeLogo,
    uploadCover,
    removeCover,
    uploadingLogo,
    uploadingCover,
  };
}
