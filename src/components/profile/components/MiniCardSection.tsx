import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { User } from 'lucide-react';
import { CropData } from '@/components/profile/profile-config';

interface MiniCardSectionProps {
  profilePhoto: File | null;
  profilePhotoUrl?: string | null;
  miniCardCrop: CropData;
  onFileChange: (file: File | null) => void;
  onCropChange: (crop: CropData) => void;
}

/**
 * Simplified Profile Photo Section
 * 
 * Uses simple center-crop with object-cover instead of complex crop tools.
 * Displays the squircle avatar preview matching the live profile.
 */
export const MiniCardSection: React.FC<MiniCardSectionProps> = ({
  profilePhoto,
  profilePhotoUrl,
  onFileChange,
}) => {
  const getCurrentImageUrl = () => {
    if (profilePhoto) {
      return URL.createObjectURL(profilePhoto);
    }
    return profilePhotoUrl || '';
  };

  const imageUrl = getCurrentImageUrl();

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2 text-foreground">
        <User className="w-4 h-4" />
        <h3 className="font-medium">Profile Photo</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Your profile photo appears as a squircle avatar across the app.
      </p>

      {/* Current Image Preview */}
      <div className="flex items-center gap-4">
        {imageUrl ? (
          <div 
            className="flex-shrink-0 overflow-hidden border-2 border-border"
            style={{
              width: '80px',
              aspectRatio: '1 / 1.05',
              borderRadius: '34%',
            }}
          >
            <img 
              src={imageUrl} 
              alt="Profile preview" 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div 
            className="flex-shrink-0 bg-muted flex items-center justify-center text-muted-foreground border-2 border-border"
            style={{
              width: '80px',
              aspectRatio: '1 / 1.05',
              borderRadius: '34%',
            }}
          >
            <User className="w-8 h-8" />
          </div>
        )}
        
        <div className="flex-1 space-y-2">
          <Label htmlFor="profilePhoto" className="text-sm">
            {imageUrl ? 'Change Photo' : 'Upload Photo'}
          </Label>
          <Input
            id="profilePhoto"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">
            Square images work best. JPG, PNG, or WebP.
          </p>
        </div>
      </div>
    </Card>
  );
};