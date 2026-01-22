import { useState, useRef } from 'react';
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
    onUpload(croppedFile);
    // Clean up object URL
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
        
        {coverUrl ? (
          <div className="relative h-32 rounded-xl overflow-hidden group">
            <img 
              src={coverUrl} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
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
