
import React, { useRef } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import HighQualityImage from '@/components/ui/high-quality-image';

interface ProfilePhotoUploaderProps {
  profilePhotoPreview: string | null;
  uploadingPhoto: boolean;
  submitting: boolean;
  onPhotoChange: (file: File | null) => void;
}

const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  profilePhotoPreview,
  uploadingPhoto,
  submitting,
  onPhotoChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onPhotoChange(file);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className="relative cursor-pointer group"
        onClick={handlePhotoClick}
        aria-label="Add profile photo"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") handlePhotoClick();
        }}
      >
        <div className="w-24 h-24 bg-muted border-2 border-dashed border-amber-700 rounded-[14px] flex items-center justify-center overflow-hidden">
          {profilePhotoPreview ? (
            <HighQualityImage
              src={profilePhotoPreview}
              alt="Profile preview"
              className="w-full h-full"
              width={96}
              height={96}
            />
          ) : (
            <Camera className="h-8 w-8 text-amber-700" />
          )}
        </div>
        <Button
          type="button"
          size="sm"
          className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 flex items-center justify-center"
          tabIndex={-1}
          onClick={e => {
            e.stopPropagation();
            handlePhotoClick();
          }}
          variant="secondary"
        >
          <Upload className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handlePhotoInputChange}
          disabled={submitting || uploadingPhoto}
          tabIndex={-1}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {profilePhotoPreview ? "Change photo" : "Add profile photo"}
      </p>
    </div>
  );
};

export default ProfilePhotoUploader;
