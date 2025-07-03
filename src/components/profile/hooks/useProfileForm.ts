
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  display_name?: string | null;
  username?: string | null;
  home_club?: string | null;
  eg_handicap_index?: number | null;
  is_public?: boolean | null;
}

interface ProfileFormData {
  displayName: string;
  username: string;
  homeClub: string;
  handicap: string;
  isPublic: boolean;
}

export const useProfileForm = (
  profile: Profile | null,
  userId: string,
  onProfileUpdate: () => void,
  onClose: () => void
) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: profile?.display_name || "",
    username: profile?.username || "",
    homeClub: profile?.home_club || "",
    handicap: profile?.eg_handicap_index?.toString() || "",
    isPublic: profile?.is_public ?? true,
  });
  const [saving, setSaving] = useState(false);

  const isUsernameSet = profile?.username && profile.username.trim() !== "";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clean username by removing spaces and converting to lowercase
    if (name === 'username') {
      const cleanedValue = value.replace(/\s+/g, '').replace('@', '').toLowerCase();
      setFormData(prev => ({
        ...prev,
        [name]: cleanedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleHandicapChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      handicap: value
    }));
  };

  const handlePublicToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isPublic: checked
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {
        display_name: formData.displayName,
        home_club: formData.homeClub || null,
        eg_handicap_index: formData.handicap ? parseFloat(formData.handicap) : null,
        is_public: formData.isPublic,
        updated_at: new Date().toISOString(),
      };

      if (!isUsernameSet) {
        // Clean username one more time before saving to ensure no spaces
        updateData.username = formData.username ? formData.username.replace(/\s+/g, '').replace('@', '').toLowerCase() : null;
      }

      await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

      onProfileUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return {
    formData,
    saving,
    isUsernameSet,
    handleInputChange,
    handleHandicapChange,
    handlePublicToggle,
    handleSave,
  };
};
