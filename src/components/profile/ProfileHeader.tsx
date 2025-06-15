
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ProfileHeaderProps {
  photoPreview: string | null;
  profilePhotoUrl: string | null;
  uploading: boolean;
  handlePhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  photoPreview,
  profilePhotoUrl,
  uploading,
  handlePhotoUpload
}) => (
  <div className="flex flex-col items-center gap-2 pt-8">
    <div className="relative">
      <img
        src={photoPreview || profilePhotoUrl || "/placeholder.svg"}
        alt="Profile"
        className="w-24 h-24 rounded-full border-4 border-green-600 object-cover"
      />
      <input
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="absolute bottom-0 right-0 w-8 h-8 opacity-0"
        style={{ cursor: 'pointer' }}
        disabled={uploading}
      />
    </div>
    <div className="text-sm mt-2 text-muted-foreground">Add a golf selfie or round photo</div>
  </div>
);

export default ProfileHeader;
