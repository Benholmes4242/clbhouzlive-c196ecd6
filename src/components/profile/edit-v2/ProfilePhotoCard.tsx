import { A } from '@/features/courses/components/holes/analytical/tokens';
import React, { useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Camera, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageCropperModal } from './ImageCropperModal';
import { PhotoActionSheet } from './PhotoActionSheet';

interface ProfilePhotoCardProps {
  currentUrl?: string | null;
  previewUrl?: string | null;
  onFileChange: (file: File | null) => void;
  onRemove?: () => void;
  variant?: 'card' | 'bare';
}

export interface ProfilePhotoCardHandle {
  openPicker: () => void;
  openSheet: () => void;
}

// Profile photo: even square (1:1) for the squircle avatar.
const PROFILE_ASPECT_RATIO = 1;

export const ProfilePhotoCard = forwardRef<ProfilePhotoCardHandle, ProfilePhotoCardProps>(({
  currentUrl,
  previewUrl,
  onFileChange,
  onRemove,
  variant = 'card',
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const displayUrl = previewUrl || currentUrl;

  const handleClick = () => {
    if (variant === 'bare') {
      setSheetOpen(true);
    } else {
      inputRef.current?.click();
    }
  };

  useImperativeHandle(ref, () => ({
    openPicker: () => inputRef.current?.click(),
    openSheet: () => setSheetOpen(true),
  }), []);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropperImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropComplete = useCallback((croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'profile-photo.jpg', { type: 'image/jpeg' });
    onFileChange(file);
    setCropperImage(null);
  }, [onFileChange]);

  const handleCropperClose = (open: boolean) => {
    if (!open) {
      setCropperImage(null);
    }
    setShowCropper(open);
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onChange={handleChange}
      className="hidden"
    />
  );

  const cropper = cropperImage ? (
    <ImageCropperModal
      open={showCropper}
      onOpenChange={handleCropperClose}
      image={cropperImage}
      aspectRatio={PROFILE_ASPECT_RATIO}
      cropShape={variant === 'bare' ? 'round' : 'rect'}
      title="Crop Profile Photo"
      onCropComplete={handleCropComplete}
    />
  ) : null;

  const triggerPicker = () => inputRef.current?.click();
  const triggerCapture = () => {
    const el = inputRef.current;
    if (!el) return;
    el.setAttribute('capture', 'user');
    el.click();
    // Remove capture so subsequent "Choose photo" opens the gallery normally.
    setTimeout(() => el.removeAttribute('capture'), 300);
  };

  if (variant === 'bare') {
    return (
      <>
        <div style={{ position: 'relative', width: 78, height: 78 }}>
          <button
            type="button"
            onClick={handleClick}
            aria-label={displayUrl ? 'Change profile photo' : 'Add profile photo'}
            style={{
              width: 78,
              height: 78,
              borderRadius: '34%',
              overflow: 'hidden',
              background: A.PANEL,
              /* The ring cuts the avatar out of the cover behind it, so it takes
                 the CANVAS value, not white. */
              border: `3px solid ${A.CANVAS}`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
              padding: 0,
              cursor: 'pointer',
              display: 'block',
            }}
          >
            {displayUrl ? (
              <img
                src={displayUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg,#1B1E27,#272C37)',
              }}>
                <User size={28} strokeWidth={1.75} style={{ color: A.MUTE }} />
              </div>
            )}
            {/* Canonical 1px traced hairline ring — ink @ 12% */}
            <span
              aria-hidden
              style={{
                position: 'absolute', inset: 0,
                borderRadius: '34%',
                border: '1px solid rgba(255,255,255,0.14)',
                pointerEvents: 'none',
              }}
            />
          </button>
          <button
            type="button"
            onClick={handleClick}
            aria-label={displayUrl ? 'Change profile photo' : 'Add profile photo'}
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: 27,
              height: 27,
              borderRadius: '50%',
              background: A.INK,
              border: `2.5px solid ${A.CANVAS}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              boxShadow: '0 2px 6px rgba(15,23,42,0.25)',
            }}
          >
            {displayUrl ? (
              <Camera size={12} strokeWidth={2.25} style={{ color: A.CANVAS }} />
            ) : (
              <Plus size={13} strokeWidth={2.5} style={{ color: A.CANVAS }} />
            )}
          </button>
        </div>
        {fileInput}
        {cropper}
        <PhotoActionSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Profile photo"
          hasPhoto={Boolean(displayUrl)}
          removeLabel="Remove photo"
          onChoose={triggerPicker}
          onTake={triggerCapture}
          onRemove={onRemove}
        />
      </>
    );
  }


  return (
    <div>
      <div className="mb-4">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Profile Photo</h3>
        <p className="text-xs text-muted-foreground">
          Your photo appears as a squircle across clbhouz
        </p>
      </div>

      <div className="flex items-center gap-4">
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
              {/* Canonical 1px traced hairline ring — ink @ 12% */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ borderRadius: '34%', border: '1px solid rgba(255,255,255,0.14)' }}
              />
            </div>

            <div className={cn(
              "absolute -bottom-1 -right-1 w-7 h-7 rounded-full shadow-lg flex items-center justify-center",
              "bg-[hsl(38,92%,50%)] text-white",
              "group-hover:scale-110 transition-transform"
            )}>
              <Plus className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>

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
            <div className="space-y-1">
              <button
                type="button"
                onClick={handleClick}
                className="text-sm font-medium text-[hsl(36,77%,49%)] hover:text-[hsl(36,77%,49%)]/80 transition-colors block"
              >
                Change photo
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="text-sm text-destructive hover:text-destructive/80 transition-colors active:opacity-70 block"
                >
                  Remove photo
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {fileInput}
      {cropper}
    </div>
  );
});

ProfilePhotoCard.displayName = 'ProfilePhotoCard';
