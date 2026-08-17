import React, { useRef, useState, useCallback } from 'react';
import { Camera } from 'lucide-react';
import { ImageCropperModal } from './ImageCropperModal';
import { PhotoActionSheet } from './PhotoActionSheet';
import { CHIP_GLASS_CLASS } from '@/styles/photoScrim';



interface HeaderPhotoCardProps {
  currentUrl?: string | null;
  previewUrl?: string | null;
  onFileChange: (file: File | null) => void;
  onRemove?: () => void;
}

/**
 * 1:1. The profile hero block is now pinned to one height (HERO_MIN_HEIGHT in
 * HeroShell), whose aspect is ~1.006 on a notched device - so a square crop is
 * what the member actually gets. ONE constant serves personal AND business;
 * both surfaces mount this card. Never fork it.
 *
 * Stored covers are NOT re-cropped: they keep composing under objectFit cover.
 */
const HEADER_ASPECT_RATIO = 1 / 1;
const HEADER_ASPECT_CSS = '1 / 1';

export const HeaderPhotoCard: React.FC<HeaderPhotoCardProps> = ({
  currentUrl,
  previewUrl,
  onFileChange,
  onRemove,
}) => {
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const displayUrl = previewUrl || currentUrl;

  const handleClick = () => setSheetOpen(true);

  const triggerPicker = () => inputRef.current?.click();
  const triggerCapture = () => {
    const el = inputRef.current;
    if (!el) return;
    el.setAttribute('capture', 'environment');
    el.click();
    setTimeout(() => el.removeAttribute('capture'), 300);
  };


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
    const file = new File([croppedBlob], 'header-photo.jpg', { type: 'image/jpeg' });
    onFileChange(file);
    setCropperImage(null);
  }, [onFileChange]);

  const handleCropperClose = (open: boolean) => {
    if (!open) {
      setCropperImage(null);
    }
    setShowCropper(open);
  };

  const cropper = cropperImage ? (
    <ImageCropperModal
      open={showCropper}
      onOpenChange={handleCropperClose}
      image={cropperImage}
      aspectRatio={HEADER_ASPECT_RATIO}
      cropShape="rect"
      title="Crop Header Photo"
      onCropComplete={handleCropComplete}
    />
  ) : null;

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onChange={handleChange}
      className="hidden"
    />
  );

return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={displayUrl ? 'Edit cover' : 'Add cover'}
        style={{
          position: 'relative',
          display: 'block',
          width: '100%',
          aspectRatio: HEADER_ASPECT_CSS,
          background: displayUrl ? 'transparent' : 'linear-gradient(135deg,#E2E8F0,#F1F5F9)',
          overflow: 'hidden',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : null}
        <span
          className={CHIP_GLASS_CLASS}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#fff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: 12.5,
            fontWeight: 500,
            padding: '7px 11px',
            borderRadius: 9,
          }}
        >
          <Camera size={13} strokeWidth={2.25} />
          {displayUrl ? 'Edit cover' : 'Add cover'}
        </span>
      </button>
      {fileInput}
      {cropper}
      <PhotoActionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Cover photo"
        hasPhoto={Boolean(displayUrl)}
        removeLabel="Remove cover"
        onChoose={triggerPicker}
        onTake={triggerCapture}
        onRemove={onRemove}
      />
    </>
  );
};
