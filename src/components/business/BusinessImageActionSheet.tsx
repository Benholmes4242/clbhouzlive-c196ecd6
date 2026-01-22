import React, { useRef, useState } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ImageCropModal } from './ImageCropModal';

interface BusinessImageActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'logo' | 'cover';
  hasImage: boolean;
  uploading: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}

// Cover aspect ratio: 1600x500 = 3.2:1
const COVER_ASPECT_RATIO = 3.2;

export function BusinessImageActionSheet({
  open,
  onOpenChange,
  type,
  hasImage,
  uploading,
  onUpload,
  onRemove,
}: BusinessImageActionSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create object URL for cropping
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setCropModalOpen(true);
      // Close the action sheet while crop modal is open
      onOpenChange(false);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    // The parent component should handle creating a local preview from the cropped file
    // before starting the upload - the croppedFile is a Blob that can be used directly
    await onUpload(croppedFile);
    // Clean up object URL
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
  };

  const handleCropModalClose = (openState: boolean) => {
    if (!openState && selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
    setCropModalOpen(openState);
  };

  const handleRemove = async () => {
    await onRemove();
    onOpenChange(false);
  };

  const title = type === 'logo' ? 'Logo' : 'Cover photo';
  const changeLabel = type === 'logo' ? 'Change logo' : 'Change cover photo';
  const removeLabel = type === 'logo' ? 'Remove logo' : 'Remove cover photo';
  const aspectRatio = type === 'logo' ? 1 : COVER_ASPECT_RATIO;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-center">{title}</SheetTitle>
          </SheetHeader>

          <div className="space-y-2">
            {/* Change option */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-sq-md bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Camera className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {uploading ? 'Uploading...' : changeLabel}
              </span>
            </button>

            {/* Remove option - only show if has image */}
            {hasImage && (
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-sq-md bg-muted/50 hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-5 w-5" />
                <span className="text-sm font-medium">{removeLabel}</span>
              </button>
            )}

            {/* Cancel */}
            <button
              onClick={() => onOpenChange(false)}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-sq-md bg-muted/30 hover:bg-muted/50 transition-colors mt-2"
            >
              <span className="text-sm font-medium text-muted-foreground">Cancel</span>
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </SheetContent>
      </Sheet>

      {/* Crop Modal */}
      {selectedImage && (
        <ImageCropModal
          open={cropModalOpen}
          onOpenChange={handleCropModalClose}
          imageSrc={selectedImage}
          aspectRatio={aspectRatio}
          onCropComplete={handleCropComplete}
          title={type === 'logo' ? 'Crop Logo' : 'Crop Cover Photo'}
        />
      )}
    </>
  );
}
