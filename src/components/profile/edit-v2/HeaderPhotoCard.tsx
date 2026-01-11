import React, { useRef } from 'react';
import { Camera, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Header photo</h2>
          <p className="text-xs text-muted-foreground">
            This image appears at the top of your profile. Use a wide, landscape photo.
          </p>
        </div>
        {!!displayUrl && (
          <button
            type="button"
            onClick={handleClick}
            className="text-sm font-medium text-slate-600 hover:text-slate-500"
          >
            Change photo
          </button>
        )}
      </div>

      {/* Preview container matches ProfilePageV2 hero exactly: h-[250px], object-cover object-bottom */}
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "relative w-full overflow-hidden rounded-xl border border-dashed border-border/70",
          "bg-[#F8FAFC] h-[200px] flex items-center justify-center",
          "hover:bg-slate-100 transition-colors group"
        )}
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="Header preview"
              className="h-full w-full object-cover object-bottom"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                <Camera className="w-4 h-4" />
                Change photo
              </div>
            </div>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            Tap to upload a header photo
          </span>
        )}
      </button>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Recommended: 1600×600px or larger. JPG, PNG, or WebP.
      </p>

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
