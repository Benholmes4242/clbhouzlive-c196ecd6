import React, { useRef } from 'react';
import { Camera, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface ProfilePhotoCardProps {
  currentUrl?: string | null;
  previewUrl?: string | null;
  onFileChange: (file: File | null) => void;
}

export const ProfilePhotoCard: React.FC<ProfilePhotoCardProps> = ({
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
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Profile Photo</h3>
            <p className="text-sm text-muted-foreground">
              Square images work best
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center justify-center py-4">
          <div 
            className="relative cursor-pointer group"
            onClick={handleClick}
          >
            <SquircleAvatar
              src={displayUrl || undefined}
              alt="Profile photo"
              size={120}
              className="border-4 border-white shadow-lg"
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[28%]">
              <Camera className="w-8 h-8 text-white" />
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
          {displayUrl ? 'Change Profile Photo' : 'Add Profile Photo'}
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
