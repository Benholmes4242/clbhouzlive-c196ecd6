import React, { useRef } from 'react';
import { Camera, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeader } from './SectionHeader';

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
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Header Photo</h3>
          <p className="text-xs text-muted-foreground">
            Appears at the top of your profile
          </p>
        </div>
        {displayUrl && (
          <button
            type="button"
            onClick={handleClick}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Change
          </button>
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
            : "border-border hover:border-primary/50 hover:bg-primary/5"
        )}
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="Header preview"
              className="h-full w-full object-cover object-bottom rounded-xl"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-xl">
              <Camera className="w-8 h-8 text-white mb-2" />
              <span className="text-white text-sm font-medium">Change photo</span>
            </div>
          </>
        ) : (
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Upload header photo
            </p>
            <p className="text-xs text-muted-foreground">
              Recommended: 1600×600px • JPG, PNG or WebP
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
    </div>
  );
};
