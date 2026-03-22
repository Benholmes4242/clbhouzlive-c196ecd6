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

// Matches profile hero: full-width × clamp(200px, 28vw, 280px). ~2:1 on mobile.
const HEADER_ASPECT_RATIO = 2 / 1;

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
          <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Header Photo</h3>
          <p className="text-xs text-muted-foreground">
            Appears at the top of your profile
          </p>
        </div>
        {displayUrl && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClick}
              className="text-sm font-medium text-[hsl(36,77%,49%)] hover:text-[hsl(36,77%,49%)]/80 transition-colors"
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
          "h-[180px] flex flex-col items-center justify-center",
          "group",
          displayUrl 
            ? "border-transparent" 
            : "border-border hover:border-[hsl(38,92%,50%)]/50 hover:bg-[hsl(38,92%,50%)]/5"
        )}
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="Header preview"
              className="h-full w-full object-cover object-center rounded-xl"
            />
            {/* Always-visible frosted camera overlay */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-xl">
              <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full bg-[hsl(38,92%,50%)]/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-[hsl(38,92%,50%)]/20 transition-colors">
              <Camera className="w-8 h-8 text-[hsl(38,92%,50%)]" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Upload header photo
            </p>
            <p className="text-xs text-muted-foreground">
              Recommended: 1600×800px • JPG, PNG or WebP
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
