
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

    console.log('Starting photo upload for user:', user.id);
    const tempPreviewUrl = URL.createObjectURL(file);
    setPhotoPreview(tempPreviewUrl);

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `${user.id}/avatar-${timestamp}.${fileExt}`;

      console.log('Uploading to path:', filePath);
      const { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (error) {
        console.error('Upload error:', error);
        alert('Upload failed: ' + error.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = urlData?.publicUrl ?? '';
      console.log('Generated avatar URL:', avatarUrl);
      
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
        alert('Failed to save profile photo: ' + updateError.message);
        setUploading(false);
        return;
      }

      console.log('Profile photo updated successfully in database');
      
      // Update local state and parent component
      setPhotoPreview(avatarUrl);
      onProfileUpdate({ ...profile, profile_photo_url: avatarUrl });
      
      console.log('Profile photo update complete');
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + (error as Error).message);
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
