import { useState, useRef } from 'react';
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
  isUploading 
}: BusinessLogoUploadProps) {
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
    <div className="flex flex-col items-center">
      <p className="text-sm font-medium text-[#1e293b] mb-1">
        Business Logo
      </p>
      <p className="text-xs text-[#64748b] mb-4 text-center">
        Your logo appears as a squircle across Clbhouz
      </p>
      
      <div className="relative">
        <SquircleAvatar
          src={logoUrl || undefined}
          fallback={businessName?.[0] || 'B'}
          size={96}
          className="border-2 border-[#e2e8f0]"
        />
        
        {/* Upload button overlay */}
        <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#F79E1B] text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#e8900f] transition-colors">
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
      
      <p className="text-xs text-[#94a3b8] mt-3">
        Square images work best
      </p>

      {/* Crop Modal */}
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
