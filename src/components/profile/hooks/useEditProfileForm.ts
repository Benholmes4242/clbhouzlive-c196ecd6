import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
import { useQueryClient } from "@tanstack/react-query";
import { BIO_MAX_LENGTH } from "@/constants/profile";

interface Profile {
  display_name?: string | null;
  username?: string | null;
  home_club?: string | null;
  eg_handicap_index?: number | null;
  is_public?: boolean | null;
  bio?: string | null;
  profile_photo_url?: string | null;
  header_photo_url?: string | null;
  websites?: string[] | null;
  mobile_crop_x?: number | null;
  mobile_crop_y?: number | null;
  mobile_crop_width?: number | null;
  mobile_crop_height?: number | null;
  desktop_crop_x?: number | null;
  desktop_crop_y?: number | null;
  desktop_crop_width?: number | null;
  desktop_crop_height?: number | null;
  mini_card_crop_x?: number | null;
  mini_card_crop_y?: number | null;
  mini_card_crop_width?: number | null;
  mini_card_crop_height?: number | null;
}

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EditProfileFormData {
  displayName: string;
  username: string;
  homeClub: string;
  handicap: string;
  isPublic: boolean;
  bio: string;
  websites: string[];
  profilePhoto: File | null;
  headerPhoto: File | null;
  mobileCropX: number;
  mobileCropY: number;
  mobileCropWidth: number;
  mobileCropHeight: number;
  desktopCropX: number;
  desktopCropY: number;
  desktopCropWidth: number;
  desktopCropHeight: number;
  miniCardCropX: number;
  miniCardCropY: number;
  miniCardCropWidth: number;
  miniCardCropHeight: number;
}

export const useEditProfileForm = (
  profile: Profile | null,
  userId: string,
  onProfileUpdate: () => void,
  onClose: () => void
) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<EditProfileFormData>(() => ({
    displayName: profile?.display_name || "",
    username: profile?.username || "",
    homeClub: profile?.home_club || "",
    handicap: profile?.eg_handicap_index?.toString() || "",
    isPublic: profile?.is_public ?? true,
    bio: profile?.bio || "",
    websites: profile?.websites || [],
    profilePhoto: null,
    headerPhoto: null,
    mobileCropX: profile?.mobile_crop_x || 0,
    mobileCropY: profile?.mobile_crop_y || 0,
    mobileCropWidth: profile?.mobile_crop_width || 100,
    mobileCropHeight: profile?.mobile_crop_height || 100,
    desktopCropX: profile?.desktop_crop_x || 0,
    desktopCropY: profile?.desktop_crop_y || 0,
    desktopCropWidth: profile?.desktop_crop_width || 100,
    desktopCropHeight: profile?.desktop_crop_height || 100,
    miniCardCropX: profile?.mini_card_crop_x || 0,
    miniCardCropY: profile?.mini_card_crop_y || 0,
    miniCardCropWidth: profile?.mini_card_crop_width || 100,
    miniCardCropHeight: profile?.mini_card_crop_height || 100,
  }));
  
  const [saving, setSaving] = useState(false);

  const isUsernameSet = profile?.username && profile.username.trim() !== "";

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'username') {
      const cleanedValue = value.replace(/\s+/g, '').replace('@', '').toLowerCase();
      setFormData(prev => ({ ...prev, [name]: cleanedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleHandicapChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, handicap: value }));
  }, []);

  const handlePublicToggle = useCallback((checked: boolean) => {
    setFormData(prev => ({ ...prev, isPublic: checked }));
  }, []);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Enforce bio character limit
    if (name === 'bio' && value.length > BIO_MAX_LENGTH) {
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = useCallback((field: 'profilePhoto' | 'headerPhoto', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  }, []);

  const handleWebsitesChange = useCallback((websites: string[]) => {
    setFormData(prev => ({ ...prev, websites }));
  }, []);

  const handleHeaderCropChange = useCallback((type: 'mobile' | 'desktop', crop: CropData) => {
    if (type === 'mobile') {
      setFormData(prev => ({
        ...prev,
        mobileCropX: crop.x,
        mobileCropY: crop.y,
        mobileCropWidth: crop.width,
        mobileCropHeight: crop.height,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        desktopCropX: crop.x,
        desktopCropY: crop.y,
        desktopCropWidth: crop.width,
        desktopCropHeight: crop.height,
      }));
    }
  }, []);

  const handleMiniCardCropChange = useCallback((crop: CropData) => {
    setFormData(prev => ({
      ...prev,
      miniCardCropX: crop.x,
      miniCardCropY: crop.y,
      miniCardCropWidth: crop.width,
      miniCardCropHeight: crop.height,
    }));
  }, []);

  const normalizeWebsites = useCallback((websites: string[]): string[] => {
    return websites
      .map(url => {
        const trimmed = url.trim();
        if (!trimmed) return '';
        
        // Add https:// if no protocol is present
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          return `https://${trimmed}`;
        }
        return trimmed;
      })
      .filter(url => url.length > 0);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updateData: any = {
        display_name: formData.displayName,
        home_club: formData.homeClub || null,
        eg_handicap_index: formData.handicap ? parseFloat(formData.handicap) : null,
        is_public: formData.isPublic,
        bio: formData.bio || null,
        websites: normalizeWebsites(formData.websites),
        mobile_crop_x: formData.mobileCropX,
        mobile_crop_y: formData.mobileCropY,
        mobile_crop_width: formData.mobileCropWidth,
        mobile_crop_height: formData.mobileCropHeight,
        desktop_crop_x: formData.desktopCropX,
        desktop_crop_y: formData.desktopCropY,
        desktop_crop_width: formData.desktopCropWidth,
        desktop_crop_height: formData.desktopCropHeight,
        mini_card_crop_x: formData.miniCardCropX,
        mini_card_crop_y: formData.miniCardCropY,
        mini_card_crop_width: formData.miniCardCropWidth,
        mini_card_crop_height: formData.miniCardCropHeight,
        updated_at: new Date().toISOString(),
      };

      if (!isUsernameSet) {
        updateData.username = formData.username ? formData.username.replace(/\s+/g, '').replace('@', '').toLowerCase() : null;
      }

      // Handle profile photo upload
      if (formData.profilePhoto) {
        const fileExt = formData.profilePhoto.name.split('.').pop();
        const fileName = `${userId}/profile-${Date.now()}.${fileExt}`;
        
        const uploadResult = await uploadToR2Only(formData.profilePhoto, 'profile-images', fileName);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Profile photo upload failed');
        }

        updateData.profile_photo_url = uploadResult.publicUrl;
      }

      // Handle header photo upload
      if (formData.headerPhoto) {
        const fileExt = formData.headerPhoto.name.split('.').pop();
        const fileName = `${userId}/header-${Date.now()}.${fileExt}`;
        
        const uploadResult = await uploadToR2Only(formData.headerPhoto, 'profile-images', fileName);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Header photo upload failed');
        }

        updateData.header_photo_url = uploadResult.publicUrl;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Invalidate React Query cache
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      onProfileUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  }, [formData, userId, isUsernameSet, normalizeWebsites, queryClient, onProfileUpdate, onClose]);

  return {
    formData,
    saving,
    isUsernameSet,
    handleInputChange,
    handleHandicapChange,
    handlePublicToggle,
    handleTextareaChange,
    handleFileChange,
    handleWebsitesChange,
    handleHeaderCropChange,
    handleMiniCardCropChange,
    handleSave,
  };
};