import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Crop } from 'lucide-react';
import { MINI_CARD_MOBILE_SIZE, MINI_CARD_DESKTOP_SIZE } from '@/constants/profile';
import { MiniCardCropTool } from './MiniCardCropTool';

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MiniCardSectionProps {
  profilePhoto: File | null;
  profilePhotoUrl?: string | null;
  miniCardCrop: CropData;
  onFileChange: (file: File | null) => void;
  onCropChange: (crop: CropData) => void;
}

export const MiniCardSection: React.FC<MiniCardSectionProps> = ({
  profilePhoto,
  profilePhotoUrl,
  miniCardCrop,
  onFileChange,
  onCropChange,
}) => {
  const [showCropTool, setShowCropTool] = useState(false);

  const getCurrentImageUrl = () => {
    if (profilePhoto) {
      return URL.createObjectURL(profilePhoto);
    }
    return profilePhotoUrl || '';
  };

  const handleCropClick = () => {
    const imageUrl = getCurrentImageUrl();
    if (!imageUrl) {
      return;
    }
    setShowCropTool(true);
  };

  const handleCropSave = (crop: CropData) => {
    onCropChange(crop);
    setShowCropTool(false);
  };

  const getCropStyle = () => {
    const centerX = miniCardCrop.x + miniCardCrop.width / 2;
    const centerY = miniCardCrop.y + miniCardCrop.height / 2;
    
    return {
      objectPosition: `${centerX}% ${centerY}%`,
      transform: `scale(${100 / Math.min(miniCardCrop.width, miniCardCrop.height)})`,
    };
  };

  const imageUrl = getCurrentImageUrl();

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">Mini Profile Card Photo</Label>
          <p className="text-sm text-muted-foreground">
            This appears as the small photo in your profile panel (3:4 aspect ratio)
          </p>
        </div>

        {/* File Upload */}
        <div className="space-y-3">
          <Label htmlFor="profilePhoto">Upload Profile Photo</Label>
          <div className="flex items-center gap-4">
            {imageUrl && (
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                <img 
                  src={imageUrl} 
                  alt="Profile preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <Input
                id="profilePhoto"
                type="file"
                accept="image/*"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Square or portrait images work best. JPG, PNG, or WebP format.
              </p>
            </div>
          </div>
        </div>

        {/* Crop Controls */}
        {imageUrl && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Adjust 3:4 Crop</Label>
                <p className="text-xs text-muted-foreground">
                  Choose which part of your photo appears in the mini card
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCropClick}
                className="gap-2"
              >
                <Crop className="w-4 h-4" />
                Adjust Crop
              </Button>
            </div>
            
            {/* Preview */}
            <div className="space-y-3">
              <Label className="text-xs font-medium">Preview:</Label>
              <div className="flex items-center gap-6">
                {/* Mobile preview */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Mobile</p>
                  <div 
                    className="rounded-lg overflow-hidden bg-gray-200 border shadow-sm"
                    style={{ 
                      width: MINI_CARD_MOBILE_SIZE.width,
                      height: MINI_CARD_MOBILE_SIZE.height 
                    }}
                  >
                    <img 
                      src={imageUrl} 
                      alt="Mobile mini card preview" 
                      className="w-full h-full object-cover"
                      style={getCropStyle()}
                    />
                  </div>
                </div>
                
                {/* Desktop preview */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Desktop</p>
                  <div 
                    className="rounded-lg overflow-hidden bg-gray-200 border shadow-sm"
                    style={{ 
                      width: MINI_CARD_DESKTOP_SIZE.width,
                      height: MINI_CARD_DESKTOP_SIZE.height 
                    }}
                  >
                    <img 
                      src={imageUrl} 
                      alt="Desktop mini card preview" 
                      className="w-full h-full object-cover"
                      style={getCropStyle()}
                    />
                  </div>
                </div>
              </div>
              
              {/* Crop info */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Crop: {miniCardCrop.x.toFixed(1)}%, {miniCardCrop.y.toFixed(1)}%</p>
                <p>Size: {miniCardCrop.width.toFixed(1)}% × {miniCardCrop.height.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Crop Tool Modal */}
        {showCropTool && imageUrl && (
          <MiniCardCropTool
            imageUrl={imageUrl}
            initialCrop={miniCardCrop}
            onSave={handleCropSave}
            onCancel={() => setShowCropTool(false)}
          />
        )}
      </div>
    </Card>
  );
};