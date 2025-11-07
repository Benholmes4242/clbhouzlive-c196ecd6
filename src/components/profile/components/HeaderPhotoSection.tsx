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
          <Label className="text-lg font-semibold">Header Photo</Label>
          <p className="text-sm text-muted-foreground">
            Upload and crop your header image for mobile and desktop views
          </p>
        </div>

        {/* File Upload */}
        <div className="space-y-3">
          <Label htmlFor="headerPhoto">Upload Header Image</Label>
          <div className="flex items-center gap-4">
            {imageUrl && (
              <div className="w-20 h-12 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                <img 
                  src={imageUrl} 
                  alt="Header preview" 
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
                Recommended: 1600×600+ pixels. JPG, PNG, or WebP format.
              </p>
            </div>
          </div>
        </div>

        {/* Crop Controls */}
        {imageUrl && (
          <Tabs defaultValue="mobile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mobile">Mobile Crop</TabsTrigger>
              <TabsTrigger value="desktop">Desktop Crop</TabsTrigger>
            </TabsList>
            
            <TabsContent value="mobile" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Mobile Hero Crop</Label>
                    <p className="text-xs text-muted-foreground">
                      How your header appears on mobile devices
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
                
                {/* Safe zone preview */}
                <div className="relative w-full h-32 rounded overflow-hidden border">
                  <img 
                    src={imageUrl} 
                    alt="Mobile preview" 
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: `${mobileCrop.x + mobileCrop.width / 2}% ${mobileCrop.y + mobileCrop.height / 2}%`
                    }}
                  />
                  {/* Safe zone overlay */}
                  <div 
                    className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white/80 via-white/40 to-transparent pointer-events-none"
                    style={{ height: `${(PROFILE_PANEL_OVERLAP_PX / 128) * 100}%` }}
                  />
                  <div className="absolute bottom-2 left-2 text-xs bg-[#0a0a0a]/60 text-white px-2 py-1 rounded">
                    Panel covers this area
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="desktop" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Desktop Hero Crop</Label>
                    <p className="text-xs text-muted-foreground">
                      How your header appears on desktop screens
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCropClick('desktop')}
                    className="gap-2"
                  >
                    <Crop className="w-4 h-4" />
                    Adjust Crop
                  </Button>
                </div>
                
                {/* Safe zone preview */}
                <div className="relative w-full h-32 rounded overflow-hidden border">
                  <img 
                    src={imageUrl} 
                    alt="Desktop preview" 
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: `${desktopCrop.x + desktopCrop.width / 2}% ${desktopCrop.y + desktopCrop.height / 2}%`
                    }}
                  />
                  {/* Safe zone overlay */}
                  <div 
                    className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white/80 via-white/40 to-transparent pointer-events-none"
                    style={{ height: `${(PROFILE_PANEL_OVERLAP_PX / 128) * 100}%` }}
                  />
                  <div className="absolute bottom-2 left-2 text-xs bg-[#0a0a0a]/60 text-white px-2 py-1 rounded">
                    Panel covers this area
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Crop Tool Modal */}
        {showCropTool && imageUrl && (
          <HeaderCropTool
            imageUrl={imageUrl}
            initialCrop={cropMode === 'mobile' ? mobileCrop : desktopCrop}
            mode={cropMode}
            onSave={handleCropSave}
            onCancel={() => setShowCropTool(false)}
          />
        )}
      </div>
    </Card>
  );
};