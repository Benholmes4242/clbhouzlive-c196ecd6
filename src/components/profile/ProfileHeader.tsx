
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

const UserPlaceholderIcon = () => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 100 100"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="50" cy="50" r="50" fill="#c5c5c5" />
    <ellipse cx="50" cy="42" rx="18" ry="16" fill="#ededed" />
    <ellipse cx="50" cy="73" rx="28" ry="18" fill="#ededed" />
  </svg>
);

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  photoPreview,
  profilePhotoUrl,
  uploading,
  handlePhotoUpload
}) => {
  const hasPhoto = !!photoPreview || !!profilePhotoUrl;

  return (
    <div className="flex flex-col items-center gap-3 pt-8">
      <div className="relative shadow-xl">
        {/* Always provide a soft gray background and border behind the avatar */}
        <div className="w-40 h-40 md:w-52 md:h-52 rounded-full border-4 border-green-700 overflow-hidden bg-[#ececec] flex items-center justify-center object-cover transition-all relative">
          {hasPhoto ? (
            // Avatar image, always fills the circle with object-cover
            <img
              src={photoPreview || profilePhotoUrl!}
              alt="Profile"
              className="w-full h-full object-cover bg-[#ececec] select-none"
              style={{ backgroundColor: "#ececec" }}
              draggable={false}
            />
          ) : (
            <UserPlaceholderIcon />
          )}
        </div>
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
};

export default ProfileHeader;

