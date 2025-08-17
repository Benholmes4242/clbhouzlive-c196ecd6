import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Video, Upload, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useProfileMediaUpload } from '@/hooks/useProfileMediaUpload';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';

interface ProfileMediaItem {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  display_order: number;
  header_processing_status: 'pending' | 'processing' | 'success' | 'error';
  header_extended_url?: string;
  header_strip_url?: string;
  header_metadata?: any;
  thumbnail_url?: string;
}

interface ProfileMediaManagerProps {
  userId: string;
  mediaItems: ProfileMediaItem[];
  onUpdate: () => void;
}

const ProfileMediaManager: React.FC<ProfileMediaManagerProps> = ({
  userId,
  mediaItems,
  onUpdate
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const isMobile = useIsMobile();
  
  const { uploadMedia, uploading, processingStatus, reprocessHeader } = useProfileMediaUpload(
    userId,
    onUpdate
  );

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files).filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    if (fileArray.length > 0) {
      uploadMedia(fileArray);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const getStatusBadge = (item: ProfileMediaItem) => {
    const status = processingStatus[item.id] || item.header_processing_status;
    
    if (!isMobile) return null;

    switch (status) {
      case 'processing':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Enhancing header...
          </Badge>
        );
      case 'success':
        return (
          <Badge variant="default" className="gap-1 bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3" />
            Header enhanced
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Enhancement failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Upload className="w-3 h-3" />
            Pending enhancement
          </Badge>
        );
      default:
        return null;
    }
  };

  const canUploadMore = mediaItems.length < 5;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canUploadMore && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-primary/50'}
          `}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={uploading}
          />
          
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : (
              <div className="flex gap-2">
                <Camera className="w-6 h-6 text-muted-foreground" />
                <Video className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            
            <div>
              <p className="font-medium">
                {uploading ? 'Uploading...' : 'Select Profile Media'}
              </p>
              <p className="text-sm text-muted-foreground">
                {uploading 
                  ? 'Please wait while we upload your media'
                  : `Drop files here or click to select (${mediaItems.length}/5)`
                }
              </p>
              {isMobile && !uploading && (
                <p className="text-xs text-blue-600 mt-1">
                  ✨ Headers will be automatically enhanced on mobile
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Media Items List */}
      {mediaItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Profile Media ({mediaItems.length}/5)</h4>
          
          {mediaItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                {item.media_type === 'video' ? (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Video className="w-4 h-4 text-muted-foreground" />
                  </div>
                ) : (
                  <img 
                    src={item.media_url} 
                    alt="Profile media"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.media_type === 'video' ? 'Video' : 'Image'} #{item.display_order}
                </p>
                {getStatusBadge(item)}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {isMobile && item.header_processing_status === 'error' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reprocessHeader(item.id, item.media_url, item.media_type)}
                    disabled={processingStatus[item.id] === 'processing'}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      {mediaItems.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No profile media uploaded yet</p>
          <p className="text-sm">Add up to 5 photos or videos to showcase your golf journey</p>
        </div>
      )}
    </div>
  );
};

export default ProfileMediaManager;