import React, { useRef, useState, useCallback } from 'react';
import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageCropperModal } from './ImageCropperModal';

interface HeaderPhotoCardProps {
  currentUrl?: string | null;
  previewUrl?: string | null;
  onFileChange: (file: File | null) => void;
  onRemove?: () => void;
}

// Header aspect ratio: full width x 200px height (4:1 ratio for mobile, 1600×400px recommended)
const HEADER_ASPECT_RATIO = 4 / 1;

export const HeaderPhotoCard: React.FC<HeaderPhotoCardProps> = ({
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
      // Create a preview URL for the cropper
      const reader = new FileReader();
      reader.onload = () => {
        setCropperImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleCropComplete = useCallback((croppedBlob: Blob) => {
    // Convert blob to File for upload
    const file = new File([croppedBlob], 'header-photo.jpg', { type: 'image/jpeg' });
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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Header Photo</h3>
          <p className="text-xs text-muted-foreground">
            Appears at the top of your profile
          </p>
        </div>
        {displayUrl && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClick}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Change
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-sm text-destructive hover:text-destructive/80 transition-colors active:opacity-70"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border-2 border-dashed transition-all",
          "h-[200px] flex flex-col items-center justify-center",
          "group",
          displayUrl 
            ? "border-transparent" 
            : "border-border hover:border-primary/50 hover:bg-primary/5"
        )}
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="Header preview"
              className="h-full w-full object-cover object-center rounded-xl"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-xl">
              <Camera className="w-8 h-8 text-white mb-2" />
              <span className="text-white text-sm font-medium">Change photo</span>
            </div>
          </>
        ) : (
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Upload header photo
            </p>
            <p className="text-xs text-muted-foreground">
              Recommended: 1600×400px • JPG, PNG or WebP
            </p>
          </div>
        )}
      </button>

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
          aspectRatio={HEADER_ASPECT_RATIO}
          cropShape="rect"
          title="Crop Header Photo"
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};
