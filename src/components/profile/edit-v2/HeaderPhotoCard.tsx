import React, { useRef } from 'react';
import { Camera, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface HeaderPhotoCardProps {
  currentUrl?: string | null;
  previewUrl?: string | null;
  onFileChange: (file: File | null) => void;
}

export const HeaderPhotoCard: React.FC<HeaderPhotoCardProps> = ({
  currentUrl,
  previewUrl,
  onFileChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl || currentUrl;

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileChange(file);
  };

  return (
    <Card className="overflow-hidden bg-white shadow-sm">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Header Photo</h3>
            <p className="text-sm text-muted-foreground">
              Best results with landscape images (1600×600 or larger)
            </p>
          </div>
        </div>

        {/* Preview */}
        <div 
          className="relative aspect-[16/6] bg-muted rounded-sq-md overflow-hidden cursor-pointer group"
          onClick={handleClick}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Header preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex items-center gap-2 text-white text-sm font-medium">
              <Camera className="w-4 h-4" />
              Change Photo
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          className="w-full"
        >
          <Camera className="w-4 h-4 mr-2" />
          {displayUrl ? 'Change Header Photo' : 'Add Header Photo'}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </Card>
  );
};
