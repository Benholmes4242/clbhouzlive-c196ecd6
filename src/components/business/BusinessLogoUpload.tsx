import { useState, useRef, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ImageCropModal } from './ImageCropModal';

interface BusinessLogoUploadProps {
  logoUrl: string | null;
  businessName: string;
  onUpload: (file: File) => void;
  isUploading?: boolean;
}

export function BusinessLogoUpload({
  logoUrl,
  businessName,
  onUpload,
  isUploading,
}: BusinessLogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (logoUrl) {
      if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      setLocalPreviewUrl(null);
    }
  }, [logoUrl, localPreviewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setCropModalOpen(true);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    const previewUrl = URL.createObjectURL(croppedFile);
    setLocalPreviewUrl(previewUrl);
    onUpload(croppedFile);
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open && selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
    setCropModalOpen(open);
  };

  const displayUrl = localPreviewUrl || logoUrl;

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0">
        <SquircleAvatar
          key={displayUrl || 'empty'}
          src={displayUrl || undefined}
          fallback={businessName?.[0] || 'B'}
          size={96}
        />
        <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full text-white flex items-center justify-center cursor-pointer transition-colors" style={{ background: '#F7931E', boxShadow: '0 2px 8px rgba(247,147,30,0.40)', border: '2px solid white' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </label>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground">
          {displayUrl ? 'Change Logo' : 'Upload Logo'}
        </p>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Square image recommended. PNG or JPG.
        </p>
      </div>

      {selectedImage && (
        <ImageCropModal
          open={cropModalOpen}
          onOpenChange={handleModalClose}
          imageSrc={selectedImage}
          aspectRatio={1}
          onCropComplete={handleCropComplete}
          title="Crop Logo"
        />
      )}
    </div>
  );
}
