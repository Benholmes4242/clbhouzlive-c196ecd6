import { useState } from 'react';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { BusinessLogoUpload } from '../BusinessLogoUpload';
import { BusinessCoverUpload } from '../BusinessCoverUpload';
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
import { toast } from 'sonner';
import { AppLog } from '@/lib/logger';

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
      AppLog.error('[BusinessBrandingSection]', 'Logo upload error:', err);
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
    <div className="space-y-4">
      {/* Card 1: Logo */}
      <SectionCard>
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-muted-foreground">
            Logo
          </label>
          <BusinessLogoUpload
            logoUrl={logoUrl}
            businessName={businessName}
            onUpload={handleLogoUpload}
            isUploading={isUploadingLogo}
          />
        </div>
      </SectionCard>

      {/* Card 2: Cover Photo */}
      <SectionCard>
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-muted-foreground">
            Cover Photo
          </label>
          <BusinessCoverUpload
            coverUrl={coverUrl}
            onUpload={handleCoverUpload}
            isUploading={isUploadingCover}
          />
        </div>
      </SectionCard>
    </div>
  );
}
