import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ImageIcon } from 'lucide-react';
import { CropData } from '@/components/profile/profile-config';

interface HeaderPhotoSectionProps {
  headerPhoto: File | null;
  headerPhotoUrl?: string | null;
  mobileCrop: CropData;
  desktopCrop: CropData;
  onFileChange: (file: File | null) => void;
  onMobileCropChange: (crop: CropData) => void;
  onDesktopCropChange: (crop: CropData) => void;
}

/**
 * Simplified Header Photo Section
 * 
 * Uses simple center-crop with object-cover instead of complex crop tools.
 * The live profile already uses object-cover, so we match that behavior.
 */
export const HeaderPhotoSection: React.FC<HeaderPhotoSectionProps> = ({
  headerPhoto,
  headerPhotoUrl,
  onFileChange,
}) => {
  const getCurrentImageUrl = () => {
    if (headerPhoto) {
      return URL.createObjectURL(headerPhoto);
    }
    return headerPhotoUrl || '';
  };

  const imageUrl = getCurrentImageUrl();

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2 text-foreground">
        <ImageIcon className="w-4 h-4" />
        <h3 className="font-medium">Header Photo</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        This image appears at the top of your profile. Use a landscape image for best results.
      </p>

      {/* Current Image Preview */}
      {imageUrl && (
        <div className="relative w-full h-32 rounded-sq-md overflow-hidden border border-border">
          <img 
            src={imageUrl} 
            alt="Header preview" 
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay showing where profile card overlaps */}
          <div 
            className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-background/80 via-background/40 to-transparent pointer-events-none"
          />
          <div className="absolute bottom-2 left-2 text-xs bg-foreground/60 text-background px-2 py-1 rounded-sq-xs">
            Profile card overlaps here
          </div>
        </div>
      )}

      {/* File Upload */}
      <div className="space-y-2">
        <Label htmlFor="headerPhoto" className="text-sm">
          {imageUrl ? 'Change Image' : 'Upload Image'}
        </Label>
        <Input
          id="headerPhoto"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          className="cursor-pointer"
        />
        <p className="text-xs text-muted-foreground">
          Recommended: 1600×600 pixels or larger. JPG, PNG, or WebP.
        </p>
      </div>
    </Card>
  );
};