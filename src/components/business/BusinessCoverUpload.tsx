import { useState, useRef, useEffect } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { ImageCropModal } from './ImageCropModal';

interface BusinessCoverUploadProps {
  coverUrl: string | null;
  onUpload: (file: File) => void;
  isUploading?: boolean;
}

// Cover aspect ratio: 1600x500 = 3.2:1
const COVER_ASPECT_RATIO = 3.2;

export function BusinessCoverUpload({ 
  coverUrl, 
  onUpload,
  isUploading 
}: BusinessCoverUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Local preview URL - shows cropped image immediately while upload happens
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // Sync local preview with prop when prop changes (e.g., after upload completes or initial load)
  useEffect(() => {
    if (coverUrl) {
      // If we have a local preview blob URL, revoke it since we now have the real URL
      if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      setLocalPreviewUrl(null);
    }
  }, [coverUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create object URL for cropping
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setCropModalOpen(true);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    // Create a preview URL from the cropped file immediately
    const previewUrl = URL.createObjectURL(croppedFile);
    setLocalPreviewUrl(previewUrl);
    
    // Trigger the upload
    onUpload(croppedFile);
    
    // Clean up the original selected image URL
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

  // Use local preview if available, otherwise fall back to prop
  const displayUrl = localPreviewUrl || coverUrl;

  return (
    <div>
      <p className="text-sm font-medium text-[#1e293b] mb-1">
        Cover Photo
      </p>
      <p className="text-xs text-[#64748b] mb-3">
        Appears at the top of your business profile
      </p>
      
      <label className="block cursor-pointer">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {displayUrl ? (
          <div className="relative h-32 rounded-xl overflow-hidden group">
            <img 
              key={displayUrl}
              src={displayUrl} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
            {isUploading && (
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded-full text-xs text-white">
                Uploading...
              </div>
            )}
          </div>
        ) : (
          <div className="h-32 rounded-xl border-2 border-dashed border-[#e2e8f0] bg-[#f8fafc] flex flex-col items-center justify-center hover:border-[#F79E1B] hover:bg-[#FFF7ED] transition-colors">
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-[#F79E1B] animate-spin" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mb-2">
                  <Camera className="w-5 h-5 text-[#64748b]" />
                </div>
                <p className="text-sm font-medium text-[#1e293b]">
                  Upload cover photo
                </p>
                <p className="text-xs text-[#94a3b8]">
                  Recommended: 1600×500px • JPG, PNG or WebP
                </p>
              </>
            )}
          </div>
        )}
      </label>

      {/* Crop Modal */}
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
