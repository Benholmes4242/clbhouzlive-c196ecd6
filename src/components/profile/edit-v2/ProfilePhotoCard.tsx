import React, { useRef, useState, useCallback } from 'react';
import { Camera, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageCropperModal } from './ImageCropperModal';

interface ProfilePhotoCardProps {
  currentUrl?: string | null;
  previewUrl?: string | null;
  onFileChange: (file: File | null) => void;
  onRemove?: () => void;
}

// Profile photo aspect ratio: squircle spec (1:1.05)
const PROFILE_ASPECT_RATIO = 1 / 1.05;

export const ProfilePhotoCard: React.FC<ProfilePhotoCardProps> = ({
  currentUrl,
  previewUrl,
  onFileChange,
  onRemove,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const displayUrl = previewUrl || currentUrl;

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropperImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropComplete = useCallback((croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'profile-photo.jpg', { type: 'image/jpeg' });
    onFileChange(file);
    setCropperImage(null);
  }, [onFileChange]);

  const handleCropperClose = (open: boolean) => {
    if (!open) {
      setCropperImage(null);
    }
    setShowCropper(open);
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Profile Photo</h3>
        <p className="text-xs text-muted-foreground">
          Your photo appears as a squircle across clbhouz
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Profile photo preview — 100px squircle */}
        <div className="relative">
          <button
            type="button"
            onClick={handleClick}
            className="relative group"
          >
            <div 
              className={cn(
                "overflow-hidden bg-muted relative transition-transform group-hover:scale-[1.02]",
                "border-4 border-background shadow-xl"
              )}
              style={{
                width: '100px',
                aspectRatio: '1 / 1.05',
                borderRadius: '34%',
              }}
            >
              {displayUrl ? (
                <>
                  <img 
                    src={displayUrl} 
                    alt="Profile preview" 
                    className="h-full w-full object-cover" 
                  />
                  {/* Hover overlay */}
                  <div 
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    style={{ borderRadius: '34%' }}
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <User className="w-10 h-10 text-muted-foreground/50" />
                </div>
              )}
            </div>
            
            {/* Upload button badge — 28px */}
            <div className={cn(
              "absolute -bottom-1 -right-1 w-7 h-7 rounded-full shadow-lg flex items-center justify-center",
              "bg-[hsl(38,92%,50%)] text-white",
              "group-hover:scale-110 transition-transform"
            )}>
              <Plus className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
        
        {/* Text and action */}
        <div className="flex-1">
          {!displayUrl ? (
            <div>
              <p className="text-sm font-medium text-foreground mb-0.5">
                Add a profile photo
              </p>
              <p className="text-xs text-muted-foreground">
                Square images work best
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <button
                type="button"
                onClick={handleClick}
                className="text-sm font-medium text-[hsl(36,77%,49%)] hover:text-[hsl(36,77%,49%)]/80 transition-colors block"
              >
                Change photo
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="text-sm text-destructive hover:text-destructive/80 transition-colors active:opacity-70 block"
                >
                  Remove photo
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />

      {/* Image Cropper Modal */}
      {cropperImage && (
        <ImageCropperModal
          open={showCropper}
          onOpenChange={handleCropperClose}
          image={cropperImage}
          aspectRatio={PROFILE_ASPECT_RATIO}
          cropShape="rect"
          title="Crop Profile Photo"
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};
