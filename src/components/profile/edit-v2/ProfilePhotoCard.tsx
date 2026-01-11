import React, { useRef } from 'react';
import { Camera, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Profile Photo</h3>
        <p className="text-xs text-muted-foreground">
          Your photo appears as a squircle across Clbhouz
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Large profile photo preview */}
        <div className="relative">
          <button
            type="button"
            onClick={handleClick}
            className="relative group"
          >
            <div 
              className={cn(
                "overflow-hidden bg-muted relative transition-transform group-hover:scale-[1.02]",
                "border-4 border-background shadow-xl"
              )}
              style={{
                width: '100px',
                aspectRatio: '1 / 1.05',
                borderRadius: '34%',
              }}
            >
              {displayUrl ? (
                <>
                  <img 
                    src={displayUrl} 
                    alt="Profile preview" 
                    className="h-full w-full object-cover" 
                  />
                  {/* Hover overlay */}
                  <div 
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    style={{ borderRadius: '34%' }}
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <User className="w-10 h-10 text-muted-foreground/50" />
                </div>
              )}
            </div>
            
            {/* Upload button badge */}
            <div className={cn(
              "absolute -bottom-1 -right-1 w-8 h-8 rounded-full shadow-lg flex items-center justify-center",
              "bg-primary text-primary-foreground",
              "group-hover:scale-110 transition-transform"
            )}>
              <Plus className="w-4 h-4" />
            </div>
          </button>
        </div>
        
        {/* Text and action */}
        <div className="flex-1">
          {!displayUrl ? (
            <div>
              <p className="text-sm font-medium text-foreground mb-0.5">
                Add a profile photo
              </p>
              <p className="text-xs text-muted-foreground">
                Square images work best
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClick}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Change photo
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};
