import { useState, useRef, useEffect } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { ImageCropModal } from './ImageCropModal';

interface BusinessCoverUploadProps {
  coverUrl: string | null;
  onUpload: (file: File) => void;
  isUploading?: boolean;
}

const COVER_ASPECT_RATIO = 3.2;

export function BusinessCoverUpload({
  coverUrl,
  onUpload,
  isUploading,
}: BusinessCoverUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (coverUrl) {
      if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      setLocalPreviewUrl(null);
    }
  }, [coverUrl, localPreviewUrl]);

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

  const displayUrl = localPreviewUrl || coverUrl;

  return (
    <div>
      <label className="block cursor-pointer">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {displayUrl ? (
          <div className="relative aspect-[3.2/1] rounded-xl overflow-hidden group">
            <img
              key={displayUrl}
              src={displayUrl}
              alt="Cover"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-background animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-background" />
              )}
            </div>
            {isUploading && (
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-foreground/60 rounded-full text-[11px] text-background">
                Uploading...
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[3.2/1] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors" style={{ borderColor: 'rgba(15,23,42,0.12)', background: 'rgba(15,23,42,0.04)' }}>
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#F7931E' }} />
            ) : (
              <>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}>
                  <Camera className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-[13px] font-medium text-foreground">
                  Upload cover photo
                </p>
                <p className="text-[12px] text-muted-foreground">
                  Recommended: 1600×500px • JPG, PNG or WebP
                </p>
              </>
            )}
          </div>
        )}
      </label>

      {selectedImage && (
        <ImageCropModal
          open={cropModalOpen}
          onOpenChange={handleModalClose}
          imageSrc={selectedImage}
          aspectRatio={COVER_ASPECT_RATIO}
          onCropComplete={handleCropComplete}
          title="Crop Cover Photo"
        />
      )}
    </div>
  );
}
