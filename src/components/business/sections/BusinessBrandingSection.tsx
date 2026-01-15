import { useState } from 'react';
import { Camera } from 'lucide-react';
import { BusinessSectionHeader } from '../BusinessSectionHeader';
import { BusinessLogoUpload } from '../BusinessLogoUpload';
import { BusinessCoverUpload } from '../BusinessCoverUpload';
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
import { toast } from 'sonner';

interface BusinessBrandingSectionProps {
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  coverUrl: string | null;
  setCoverUrl: (url: string | null) => void;
  businessName: string;
}

export function BusinessBrandingSection({
  logoUrl,
  setLogoUrl,
  coverUrl,
  setCoverUrl,
  businessName,
}: BusinessBrandingSectionProps) {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const result = await uploadToR2Only(file, 'clbhouz-club-logos');
      if (result.success && result.publicUrl) {
        setLogoUrl(result.publicUrl);
        toast.success('Logo uploaded');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setIsUploadingCover(true);
    try {
      const result = await uploadToR2Only(file, 'clbhouz-profile-banners');
      if (result.success && result.publicUrl) {
        setCoverUrl(result.publicUrl);
        toast.success('Cover photo uploaded');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Cover upload error:', err);
      toast.error('Failed to upload cover photo');
    } finally {
      setIsUploadingCover(false);
    }
  };

  return (
    <div>
      <BusinessSectionHeader
        icon={Camera}
        title="Branding"
        description="Add your logo and cover photo to stand out"
      />
      
      {/* Logo Upload */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 mb-5">
        <BusinessLogoUpload
          logoUrl={logoUrl}
          businessName={businessName}
          onUpload={handleLogoUpload}
          isUploading={isUploadingLogo}
        />
      </div>
      
      {/* Cover Upload */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
        <BusinessCoverUpload
          coverUrl={coverUrl}
          onUpload={handleCoverUpload}
          isUploading={isUploadingCover}
        />
      </div>
      
      {/* Tip */}
      <p className="text-xs text-[#64748b] mt-4 text-center">
        You can always update these later from your business profile settings.
      </p>
    </div>
  );
}
