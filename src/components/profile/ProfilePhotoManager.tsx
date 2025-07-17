
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

  // Function to process and optimize image for high quality
  const processImageFile = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set very high-quality dimensions (4K: 3840x3840 max for true 4K quality)
        const maxSize = 3840; // True 4K resolution
        let { width, height } = img;
        
        // Always upscale to at least 1024x1024 for small images
        const minSize = 1024;
        if (width < minSize && height < minSize) {
          if (width > height) {
            height = (height * minSize) / width;
            width = minSize;
          } else {
            width = (width * minSize) / height;
            height = minSize;
          }
        }
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Use high-quality rendering
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to high-quality JPEG (95% quality)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const processedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(processedFile);
              } else {
                reject(new Error('Failed to process image'));
              }
            },
            'image/jpeg',
            0.95 // 95% quality for crisp, high-resolution images
          );
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting photo upload for user:', user.id);
    const tempPreviewUrl = URL.createObjectURL(file);
    setPhotoPreview(tempPreviewUrl);

    setUploading(true);
    try {
      // Process the image for high quality
      console.log('Processing image for high quality...');
      const processedFile = await processImageFile(file);
      console.log('Image processed successfully, original size:', file.size, 'processed size:', processedFile.size);
      
      // Upload processed image to Cloudflare R2
      const uploadResult = await uploadToCloudflareR2(processedFile, 'avatars', `avatar.${processedFile.name.split('.').pop()}`);
      
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
