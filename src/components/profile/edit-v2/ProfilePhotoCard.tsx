import React, { useRef } from 'react';
import { Camera, User } from 'lucide-react';

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
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Profile photo</h2>
          <p className="text-xs text-muted-foreground">
            Your photo appears as a squircle across clbhouz.
          </p>
        </div>
        {displayUrl && (
          <button
            type="button"
            onClick={handleClick}
            className="text-sm font-medium text-slate-600 hover:text-slate-500"
          >
            Change photo
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-3 group"
      >
        {/* Squircle spec: 1/1.05 aspect ratio, 34% border radius - matches Creator capsule SquircleAvatar */}
        <div 
          className="overflow-hidden border border-border bg-[#F8FAFC] relative"
          style={{
            width: '80px',
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
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                style={{ borderRadius: '34%' }}
              >
                <Camera className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <User className="w-8 h-8" />
            </div>
          )}
        </div>
        {!displayUrl && (
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            Add photo
          </span>
        )}
      </button>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Square images work best. JPG, PNG, or WebP.
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
