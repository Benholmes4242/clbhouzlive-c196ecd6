import React, { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackgroundUploadProps {
  userId: string;
  currentBackgroundUrl?: string | null;
  onBackgroundUpdate: (url: string | null) => void;
}

const BackgroundUpload: React.FC<BackgroundUploadProps> = ({
  userId,
  currentBackgroundUrl,
  onBackgroundUpdate
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Delete existing background if it exists
      if (currentBackgroundUrl) {
        const oldPath = currentBackgroundUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('profile-backgrounds')
            .remove([`${userId}/${oldPath}`]);
        }
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload new background
      const { error: uploadError } = await supabase.storage
        .from('profile-backgrounds')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-backgrounds')
        .getPublicUrl(filePath);

      // Update profile with new background URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ background_image_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      onBackgroundUpdate(publicUrl);
      
      toast({
        title: 'Background updated',
        description: 'Your profile background has been updated successfully.',
      });
    } catch (error) {
      console.error('Error uploading background:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload background image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveBackground = async () => {
    if (!currentBackgroundUrl) return;

    setUploading(true);

    try {
      // Delete from storage
      const oldPath = currentBackgroundUrl.split('/').pop();
      if (oldPath) {
        await supabase.storage
          .from('profile-backgrounds')
          .remove([`${userId}/${oldPath}`]);
      }

      // Update profile
      const { error } = await supabase
        .from('user_profiles')
        .update({ background_image_url: null })
        .eq('id', userId);

      if (error) throw error;

      onBackgroundUpdate(null);
      
      toast({
        title: 'Background removed',
        description: 'Your profile background has been removed.',
      });
    } catch (error) {
      console.error('Error removing background:', error);
      toast({
        title: 'Remove failed',
        description: 'Failed to remove background image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="bg-white/20 border-white/30 text-white hover:bg-white/30"
      >
        <Camera className="h-4 w-4 mr-2" />
        {uploading ? 'Uploading...' : 'Change Background'}
      </Button>

      {currentBackgroundUrl && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemoveBackground}
          disabled={uploading}
          className="bg-red-500/20 border-red-500/30 text-white hover:bg-red-500/30"
        >
          <X className="h-4 w-4 mr-2" />
          Remove
        </Button>
      )}
    </div>
  );
};

export default BackgroundUpload;