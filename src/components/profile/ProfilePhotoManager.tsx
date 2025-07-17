
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadToCloudflareR2 } from '@/utils/cloudflareUpload';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Starting photo upload for user:', user.id);
    const tempPreviewUrl = URL.createObjectURL(file);
    setPhotoPreview(tempPreviewUrl);

    setUploading(true);
    try {
      // Upload to Cloudflare R2 instead of Supabase storage
      const uploadResult = await uploadToCloudflareR2(file, 'avatars', `avatar.${file.name.split('.').pop()}`);
      
      if (!uploadResult.success || !uploadResult.publicUrl) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      const avatarUrl = uploadResult.publicUrl;
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
        toast({
          title: "Upload Failed",
          description: "Failed to save profile photo: " + updateError.message,
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      console.log('Profile photo updated successfully in database');
      
      // Update local state and parent component
      setPhotoPreview(avatarUrl);
      onProfileUpdate({ ...profile, profile_photo_url: avatarUrl });
      
      toast({
        title: "Profile Updated",
        description: "Your profile photo has been updated successfully.",
      });
      
      console.log('Profile photo update complete');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Upload failed: " + (error as Error).message,
        variant: "destructive",
      });
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
