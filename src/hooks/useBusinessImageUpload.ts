import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
import { toast } from '@/lib/toast';
import { useQueryClient } from '@tanstack/react-query';
import { AppLog } from '@/lib/logger';
import { protectBusinessPayload } from '@/components/business/editor/editorPermissions';

// BE2 opts into changed-field-only protected writes and propagated failures;
// all existing callers retain their timestamps, toasts and swallowed errors.
export function useBusinessImageUpload(businessId: string | undefined, immediate?: { role?: string }) {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const queryClient = useQueryClient();

  const invalidateAllBusinessQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['business-profile', 'v3_course_fallback', businessId] }),
      queryClient.invalidateQueries({ queryKey: ['my-businesses'] }),
    ]);
  }, [queryClient, businessId]);

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
        .update(immediate ? protectBusinessPayload({ logo_url: uploadResult.publicUrl }, immediate.role) : { logo_url: uploadResult.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', businessId);

      if (error) throw error;

      await invalidateAllBusinessQueries();
      toast.success('Logo updated');
      
      return uploadResult.publicUrl;
    } catch (error) {
      AppLog.error('[useBusinessImageUpload]', 'Error uploading logo:', error);
      toast.error("Couldn't upload logo");
      if (immediate) throw error;
      return null;
    } finally {
      setUploadingLogo(false);
    }
  }, [businessId, invalidateAllBusinessQueries, immediate?.role, !!immediate]);

  const removeLogo = useCallback(async () => {
    if (!businessId) return;
    
    try {
      const { error } = await supabase
        .from('business_accounts')
        .update(immediate ? protectBusinessPayload({ logo_url: null }, immediate.role) : { logo_url: null, updated_at: new Date().toISOString() })
        .eq('id', businessId);

      if (error) throw error;

      await invalidateAllBusinessQueries();
      toast.success('Logo removed');
    } catch (error) {
      AppLog.error('[useBusinessImageUpload]', 'Error removing logo:', error);
      toast.error("Couldn't remove logo");
      if (immediate) throw error;
    }
  }, [businessId, invalidateAllBusinessQueries, immediate?.role, !!immediate]);

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
        .update(immediate ? protectBusinessPayload({ cover_image_url: uploadResult.publicUrl }, immediate.role) : { cover_image_url: uploadResult.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', businessId);

      if (error) throw error;

      await invalidateAllBusinessQueries();
      toast.success('Cover updated');
      
      return uploadResult.publicUrl;
    } catch (error) {
      AppLog.error('[useBusinessImageUpload]', 'Error uploading cover:', error);
      toast.error("Couldn't upload cover");
      if (immediate) throw error;
      return null;
    } finally {
      setUploadingCover(false);
    }
  }, [businessId, invalidateAllBusinessQueries, immediate?.role, !!immediate]);

  const removeCover = useCallback(async () => {
    if (!businessId) return;
    
    try {
      const { error } = await supabase
        .from('business_accounts')
        .update(immediate ? protectBusinessPayload({ cover_image_url: null }, immediate.role) : { cover_image_url: null, updated_at: new Date().toISOString() })
        .eq('id', businessId);

      if (error) throw error;

      await invalidateAllBusinessQueries();
      toast.success('Cover photo removed');
    } catch (error) {
      AppLog.error('[useBusinessImageUpload]', 'Error removing cover:', error);
      toast.error("Couldn't remove cover");
      if (immediate) throw error;
    }
  }, [businessId, invalidateAllBusinessQueries, immediate?.role, !!immediate]);

  return {
    uploadLogo,
    removeLogo,
    uploadCover,
    removeCover,
    uploadingLogo,
    uploadingCover,
  };
}
