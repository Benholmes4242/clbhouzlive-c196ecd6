import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Upload, Crop } from 'lucide-react';
import { PROFILE_PANEL_OVERLAP_PX } from '@/components/profile/profile-config';
import { CropData } from '@/components/profile/profile-config';
import { HeaderCropTool } from './HeaderCropTool';

interface HeaderPhotoSectionProps {
  headerPhoto: File | null;
  headerPhotoUrl?: string | null;
  mobileCrop: CropData;
  desktopCrop: CropData;
  onFileChange: (file: File | null) => void;
  onMobileCropChange: (crop: CropData) => void;
  onDesktopCropChange: (crop: CropData) => void;
}

export const HeaderPhotoSection: React.FC<HeaderPhotoSectionProps> = ({
  headerPhoto,
  headerPhotoUrl,
  mobileCrop,
  desktopCrop,
  onFileChange,
  onMobileCropChange,
  onDesktopCropChange,
}) => {
  const [showCropTool, setShowCropTool] = useState(false);
  const [cropMode, setCropMode] = useState<'mobile' | 'desktop'>('mobile');

  const getCurrentImageUrl = () => {
    if (headerPhoto) {
      return URL.createObjectURL(headerPhoto);
    }
    return headerPhotoUrl || '';
  };

  const handleCropClick = (mode: 'mobile' | 'desktop') => {
    const imageUrl = getCurrentImageUrl();
    if (!imageUrl) {
      return;
    }
    setCropMode(mode);
    setShowCropTool(true);
  };

  const handleCropSave = (crop: CropData) => {
    if (cropMode === 'mobile') {
      onMobileCropChange(crop);
    } else {
      onDesktopCropChange(crop);
    }
    setShowCropTool(false);
  };

  const imageUrl = getCurrentImageUrl();

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">Mini Profile Card Photo</Label>
          <p className="text-sm text-muted-foreground">
            This controls which part of the photo appears within your mini profile card photo
          </p>
        </div>

        {/* File Upload */}
        <div className="space-y-3">
          <Label htmlFor="headerPhoto">Upload Mini Profile Card Photo</Label>
          <div className="flex items-center gap-4">
            {imageUrl && (
              <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0" style={{ aspectRatio: '3/4' }}>
                <img 
                  src={imageUrl} 
                  alt="Mini profile card preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <Input
                id="headerPhoto"
                type="file"
                accept="image/png,image/jpeg,image/webp"
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
                <Label className="text-sm font-medium">Mini Profile Card Photo Crop</Label>
                <p className="text-xs text-muted-foreground">
                  This controls which part of the photo appears within your mini profile card photo
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCropClick('mobile')}
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
                      width: 84,
                      height: 112 
                    }}
                  >
                    <img 
                      src={imageUrl} 
                      alt="Mobile mini card preview" 
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${mobileCrop.x + mobileCrop.width / 2}% ${mobileCrop.y + mobileCrop.height / 2}%`
                      }}
                    />
                  </div>
                </div>
                
                {/* Desktop preview */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Desktop</p>
                  <div 
                    className="rounded-lg overflow-hidden bg-gray-200 border shadow-sm"
                    style={{ 
                      width: 112,
                      height: 149 
                    }}
                  >
                    <img 
                      src={imageUrl} 
                      alt="Desktop mini card preview" 
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${mobileCrop.x + mobileCrop.width / 2}% ${mobileCrop.y + mobileCrop.height / 2}%`
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Crop info */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Crop: {mobileCrop.x.toFixed(1)}%, {mobileCrop.y.toFixed(1)}%</p>
                <p>Size: {mobileCrop.width.toFixed(1)}% × {mobileCrop.height.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Crop Tool Modal */}
        {showCropTool && imageUrl && (
          <HeaderCropTool
            imageUrl={imageUrl}
            initialCrop={mobileCrop}
            mode="mobile"
            onSave={(crop) => onMobileCropChange(crop)}
            onCancel={() => setShowCropTool(false)}
          />
        )}
      </div>
    </Card>
  );
};