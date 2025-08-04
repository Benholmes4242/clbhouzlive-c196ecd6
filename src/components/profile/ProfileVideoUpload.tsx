import React, { useState, useRef } from 'react';
import { Upload, Video, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { getVideoDuration, generateVideoThumbnail } from '@/utils/videoThumbnail';
import { useCloudflareStream } from '@/hooks/useCloudflareStream';
import { supabase } from '@/integrations/supabase/client';

interface ProfileVideoUploadProps {
  currentVideoUrl?: string;
  currentThumbnailUrl?: string;
  onVideoUpload: (videoUrl: string, thumbnailUrl: string) => void;
  onVideoRemove: () => void;
  disabled?: boolean;
}

const ProfileVideoUpload: React.FC<ProfileVideoUploadProps> = ({
  currentVideoUrl,
  currentThumbnailUrl,
  onVideoUpload,
  onVideoRemove,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadVideo, isUploading } = useCloudflareStream();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check video duration
      const duration = await getVideoDuration(file);
      if (duration > 20) {
        toast({
          title: "Video too long",
          description: "Profile videos must be 20 seconds or less.",
          variant: "destructive"
        });
        return;
      }

      // Check file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Profile videos must be 100MB or less.",
          variant: "destructive"
        });
        return;
      }

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setPreviewFile(file);

    } catch (error) {
      console.error('Error processing video:', error);
      toast({
        title: "Error",
        description: "Failed to process video file.",
        variant: "destructive"
      });
    }
  };

  const handleUpload = async () => {
    if (!previewFile) return;

    setUploading(true);
    
    try {
      // Upload to Cloudflare Stream
      const result = await uploadVideo(previewFile, {
        title: 'Profile Video',
        description: 'User profile video'
      });

      if (!result.success || !result.videoId) {
        throw new Error(result.error || 'Upload failed');
      }

      // Generate thumbnail
      const thumbnailDataUrl = await generateVideoThumbnail(previewFile, 1);
      
      // Upload thumbnail to Supabase storage
      const thumbnailBlob = await fetch(thumbnailDataUrl).then(r => r.blob());
      const thumbnailFile = new File([thumbnailBlob], 'profile-video-thumb.jpg', { type: 'image/jpeg' });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const thumbnailPath = `${session.user.id}/profile-video-thumbnail.jpg`;
      const { data: thumbnailUpload, error: thumbnailError } = await supabase.storage
        .from('avatars')
        .upload(thumbnailPath, thumbnailFile, { upsert: true });

      if (thumbnailError) throw thumbnailError;

      const { data: thumbnailUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(thumbnailPath);

      // Get video playback URL from Cloudflare Stream
      const videoUrl = `https://customer-ybxkehyomcakqjvuhnna.cloudflarestream.com/${result.videoId}/manifest/video.m3u8`;

      onVideoUpload(videoUrl, thumbnailUrlData.publicUrl);
      
      // Clean up preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setPreviewFile(null);

      toast({
        title: "Success",
        description: "Profile video uploaded successfully!",
        variant: "default"
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload video",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = () => {
    onVideoRemove();
    toast({
      title: "Video removed",
      description: "Profile video has been removed.",
      variant: "default"
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Video className="w-5 h-5 text-muted-foreground" />
        <label className="text-sm font-medium">Profile Video</label>
        <span className="text-xs text-muted-foreground">(Optional, max 20 seconds)</span>
      </div>

      {/* Current Video Display */}
      {currentVideoUrl && !previewUrl && (
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-muted relative">
            <video
              src={currentVideoUrl}
              poster={currentThumbnailUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemoveVideo}
            className="mt-2"
            disabled={disabled}
          >
            Remove Video
          </Button>
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="space-y-3">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-muted relative">
            <video
              src={previewUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
              controls={false}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={uploading || isUploading || disabled}
              size="sm"
            >
              {uploading || isUploading ? 'Uploading...' : 'Save Video'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={uploading || isUploading || disabled}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {!currentVideoUrl && !previewUrl && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            size="sm"
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Profile Video
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            Max 20 seconds, 100MB. Supported formats: MP4, MOV
          </p>
        </div>
      )}

      {/* Replace Button */}
      {currentVideoUrl && !previewUrl && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            size="sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Replace Video
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfileVideoUpload;