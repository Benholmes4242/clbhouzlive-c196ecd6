
import React, { useState, useRef } from 'react';
import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileCoverSectionProps {
  coverImageUrl?: string | null;
  isOwnProfile: boolean;
  onCoverUpdate: (imageUrl: string) => void;
}

const ProfileCoverSection: React.FC<ProfileCoverSectionProps> = ({
  coverImageUrl,
  isOwnProfile,
  onCoverUpdate
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isOwnProfile) return;

    setUploading(true);
    // TODO: Implement cover image upload to Supabase storage
    // For now, create a preview URL
    const previewUrl = URL.createObjectURL(file);
    onCoverUpdate(previewUrl);
    setUploading(false);
  };

  return (
    <div className="relative h-48 md:h-64 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-green-100 to-blue-100">
      {coverImageUrl ? (
        <img 
          src={coverImageUrl} 
          alt="Profile cover" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#b66b41]/20 to-green-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
            {isOwnProfile && <p className="text-sm">Add a cover photo</p>}
          </div>
        </div>
      )}
      
      {isOwnProfile && (
        <>
          <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-white/90 text-gray-900 hover:bg-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              {coverImageUrl ? 'Change Cover' : 'Add Cover'}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
          />
        </>
      )}
    </div>
  );
};

export default ProfileCoverSection;
