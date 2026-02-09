/**
 * BusinessEditStep3Branding — Step 3 of business edit wizard
 * Logo and cover photo with deferred upload
 */
import React, { useRef, useState } from 'react';
import { Camera, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ImageCropModal } from '@/components/business/ImageCropModal';

const COVER_ASPECT_RATIO = 3.2;

interface BusinessEditStep3Props {
  businessName: string;
  // Current saved URLs
  currentLogoUrl: string | null;
  currentCoverUrl: string | null;
  // Deferred state
  pendingLogoFile: File | null;
  setPendingLogoFile: (f: File | null) => void;
  pendingCoverFile: File | null;
  setPendingCoverFile: (f: File | null) => void;
  localLogoPreview: string | null;
  setLocalLogoPreview: (url: string | null) => void;
  localCoverPreview: string | null;
  setLocalCoverPreview: (url: string | null) => void;
  pendingRemoveLogo: boolean;
  setPendingRemoveLogo: (v: boolean) => void;
  pendingRemoveCover: boolean;
  setPendingRemoveCover: (v: boolean) => void;
}

export function BusinessEditStep3Branding({
  businessName,
  currentLogoUrl,
  currentCoverUrl,
  pendingLogoFile,
  setPendingLogoFile,
  pendingCoverFile,
  setPendingCoverFile,
  localLogoPreview,
  setLocalLogoPreview,
  localCoverPreview,
  setLocalCoverPreview,
  pendingRemoveLogo,
  setPendingRemoveLogo,
  pendingRemoveCover,
  setPendingRemoveCover,
}: BusinessEditStep3Props) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [logoCropModalOpen, setLogoCropModalOpen] = useState(false);
  const [coverCropModalOpen, setCoverCropModalOpen] = useState(false);
  const [selectedLogoImage, setSelectedLogoImage] = useState<string | null>(null);
  const [selectedCoverImage, setSelectedCoverImage] = useState<string | null>(null);

  const effectiveLogoUrl = pendingRemoveLogo ? null : (localLogoPreview || currentLogoUrl);
  const effectiveCoverUrl = pendingRemoveCover ? null : (localCoverPreview || currentCoverUrl);

  const initials = businessName
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="h-full overflow-y-auto overscroll-contain">
      <div className="px-4 py-6 max-w-xl mx-auto space-y-6">
        {/* Section icon + heading */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#C1A84C]/10 flex items-center justify-center">
            <Camera className="w-5 h-5 text-[#C1A84C]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Branding</h2>
            <p className="text-sm text-muted-foreground">Add your logo and cover photo to stand out</p>
          </div>
        </div>

        {/* Logo card */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div>
            <Label className="text-sm text-foreground font-medium">Business Logo</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Your logo appears as a squircle across Clbhouz</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {effectiveLogoUrl ? (
                <SquircleAvatar
                  src={effectiveLogoUrl}
                  alt={businessName}
                  size={72}
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-sq-md bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  {initials}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  className="text-xs h-8 rounded-lg"
                >
                  Change
                </Button>
                {effectiveLogoUrl && (
                  <button
                    onClick={() => {
                      setPendingRemoveLogo(true);
                      setPendingLogoFile(null);
                      if (localLogoPreview) URL.revokeObjectURL(localLogoPreview);
                      setLocalLogoPreview(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors min-h-[44px] px-2"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Square images work best</p>
            </div>
          </div>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setSelectedLogoImage(url);
                setLogoCropModalOpen(true);
              }
              if (logoInputRef.current) logoInputRef.current.value = '';
            }}
            className="hidden"
          />
        </div>

        {/* Cover photo card */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <Label className="text-sm text-foreground font-medium">Cover Photo</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Appears at the top of your business profile</p>
            </div>
            {effectiveCoverUrl && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-1"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingRemoveCover(true);
                    setPendingCoverFile(null);
                    if (localCoverPreview) URL.revokeObjectURL(localCoverPreview);
                    setLocalCoverPreview(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors min-h-[44px] px-1"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="relative w-full aspect-[3.2/1] overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors group"
          >
            {effectiveCoverUrl ? (
              <>
                <img
                  src={effectiveCoverUrl}
                  alt="Cover preview"
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white text-sm font-medium">
                    <Camera className="w-4 h-4" />
                    Change photo
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Tap to upload a cover photo</span>
              </div>
            )}
          </button>

          <p className="text-xs text-muted-foreground">
            Recommended: 1600×500px • JPG, PNG or WebP
          </p>

          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setSelectedCoverImage(url);
                setCoverCropModalOpen(true);
              }
              if (coverInputRef.current) coverInputRef.current.value = '';
            }}
            className="hidden"
          />
        </div>

        <p className="text-xs text-muted-foreground text-center">
          You can always update these later.
        </p>
      </div>

      {/* Logo Crop Modal */}
      {selectedLogoImage && (
        <ImageCropModal
          open={logoCropModalOpen}
          onOpenChange={(open) => {
            if (!open && selectedLogoImage) {
              URL.revokeObjectURL(selectedLogoImage);
              setSelectedLogoImage(null);
            }
            setLogoCropModalOpen(open);
          }}
          imageSrc={selectedLogoImage}
          aspectRatio={1}
          onCropComplete={(croppedFile) => {
            setPendingLogoFile(croppedFile);
            setPendingRemoveLogo(false);
            if (localLogoPreview) URL.revokeObjectURL(localLogoPreview);
            setLocalLogoPreview(URL.createObjectURL(croppedFile));
            if (selectedLogoImage) {
              URL.revokeObjectURL(selectedLogoImage);
              setSelectedLogoImage(null);
            }
          }}
          title="Crop Logo"
        />
      )}

      {/* Cover Crop Modal */}
      {selectedCoverImage && (
        <ImageCropModal
          open={coverCropModalOpen}
          onOpenChange={(open) => {
            if (!open && selectedCoverImage) {
              URL.revokeObjectURL(selectedCoverImage);
              setSelectedCoverImage(null);
            }
            setCoverCropModalOpen(open);
          }}
          imageSrc={selectedCoverImage}
          aspectRatio={COVER_ASPECT_RATIO}
          onCropComplete={(croppedFile) => {
            setPendingCoverFile(croppedFile);
            setPendingRemoveCover(false);
            if (localCoverPreview) URL.revokeObjectURL(localCoverPreview);
            setLocalCoverPreview(URL.createObjectURL(croppedFile));
            if (selectedCoverImage) {
              URL.revokeObjectURL(selectedCoverImage);
              setSelectedCoverImage(null);
            }
          }}
          title="Crop Cover Photo"
        />
      )}
    </div>
  );
}
