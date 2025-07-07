
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProfileHeader from './ProfileHeader';

interface ProfilePhotoManagerProps {
  user: any;
  profile: {
    profile_photo_url?: string | null;
  } | null;
  onProfileUpdate: (updatedProfile: any) => void;
}

const ProfilePhotoManager: React.FC<ProfilePhotoManagerProps> = ({
  user,
  profile,
  onProfileUpdate
}) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const tempPreviewUrl = URL.createObjectURL(file);
    setPhotoPreview(tempPreviewUrl);

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `${user.id}/avatar-${timestamp}.${fileExt}`;

      const { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (error) {
        console.error('Upload error:', error);
        alert('Upload failed!');
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = urlData?.publicUrl ?? '';
      
      // Update database
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          profile_photo_url: avatarUrl, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        alert('Failed to save profile photo!');
        setUploading(false);
        return;
      }

      // Update local state and parent component
      setPhotoPreview(avatarUrl);
      onProfileUpdate({ ...profile, profile_photo_url: avatarUrl });
      
      // Show success feedback
      console.log('Profile photo updated successfully');
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed!');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProfileHeader
      photoPreview={photoPreview}
      profilePhotoUrl={profile?.profile_photo_url ?? ""}
      uploading={uploading}
      handlePhotoUpload={handlePhotoUpload}
      canEdit={!!user}
    />
  );
};

export default ProfilePhotoManager;
