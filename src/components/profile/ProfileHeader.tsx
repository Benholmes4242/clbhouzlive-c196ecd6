
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
  <div className="flex flex-col items-center gap-3 pt-8">
    <div className="relative shadow-lg">
      <img
        src={photoPreview || profilePhotoUrl || "/placeholder.svg"}
        alt="Profile"
        className="w-40 h-40 md:w-52 md:h-52 rounded-full border-4 border-green-600 object-cover transition-all"
        style={{ background: "#f3f3f3" }}
      />
      <input
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="absolute bottom-2 right-2 w-10 h-10 opacity-0 cursor-pointer"
        disabled={uploading}
      />
      <div className="absolute bottom-2 right-2 bg-green-700 text-white p-2 rounded-full shadow hover:bg-green-800 transition-colors pointer-events-none">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M13.7 9.35A3.35 3.35 0 1 1 7 9.35a3.35 3.35 0 0 1 6.7 0Z" stroke="white" strokeWidth="1.7"/>
          <rect x="2.25" y="4.25" width="15.5" height="13.5" rx="2.5" stroke="white" strokeWidth="1.7"/>
        </svg>
      </div>
    </div>
  </div>
);

export default ProfileHeader;
