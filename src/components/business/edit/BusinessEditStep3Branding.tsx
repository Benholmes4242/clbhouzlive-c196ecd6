/**
 * BusinessEditStep3Branding — Step 3 of business edit wizard
 * Logo and cover photo with deferred upload
 */
import { useRef, useState } from 'react';
import { Camera, Plus, Loader2 } from 'lucide-react';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ImageCropModal } from '@/components/business/ImageCropModal';

const COVER_ASPECT_RATIO = 3.2;

interface BusinessEditStep3Props {
  businessName: string;
  currentLogoUrl: string | null;
  currentCoverUrl: string | null;
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

  return (
    <div className="space-y-4 px-4 pb-4 pt-2">
      {/* Card 1: Logo */}
      <SectionCard>
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-muted-foreground">
            Logo
          </label>
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <SquircleAvatar
                key={effectiveLogoUrl || 'empty'}
                src={effectiveLogoUrl || undefined}
                fallback={businessName?.[0] || 'B'}
                size={96}
              />
              <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#f59e0b] text-white flex items-center justify-center cursor-pointer shadow-sm hover:bg-[#e8920f] transition-colors">
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
                <Plus className="w-4 h-4" />
              </label>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-foreground">
                {effectiveLogoUrl ? 'Change Logo' : 'Upload Logo'}
              </p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Square image recommended. PNG or JPG.
              </p>
              {effectiveLogoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setPendingRemoveLogo(true);
                    setPendingLogoFile(null);
                    if (localLogoPreview) URL.revokeObjectURL(localLogoPreview);
                    setLocalLogoPreview(null);
                  }}
                  className="text-[12px] font-medium text-destructive mt-1"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Card 2: Cover Photo */}
      <SectionCard>
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-muted-foreground">
            Cover Photo
          </label>

          <label className="block cursor-pointer">
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

            {effectiveCoverUrl ? (
              <div className="relative aspect-[3.2/1] rounded-xl overflow-hidden group">
                <img
                  src={effectiveCoverUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-background" />
                </div>
              </div>
            ) : (
              <div className="aspect-[3.2/1] rounded-xl border-2 border-dashed border-border bg-muted flex flex-col items-center justify-center hover:border-[#f59e0b]/40 hover:bg-[#f59e0b]/5 transition-colors">
                <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center mb-2">
                  <Camera className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-[13px] font-medium text-foreground">
                  Upload cover photo
                </p>
                <p className="text-[12px] text-muted-foreground">
                  Recommended: 1600×500px • JPG, PNG or WebP
                </p>
              </div>
            )}
          </label>

          {effectiveCoverUrl && (
            <button
              type="button"
              onClick={() => {
                setPendingRemoveCover(true);
                setPendingCoverFile(null);
                if (localCoverPreview) URL.revokeObjectURL(localCoverPreview);
                setLocalCoverPreview(null);
              }}
              className="text-[12px] font-medium text-destructive"
            >
              Remove
            </button>
          )}
        </div>
      </SectionCard>

      <p className="text-[12px] text-muted-foreground text-center">
        You can always update these later from your business profile settings.
      </p>

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
          aspectRatio={1 / 1.05}
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
