
import React, { useRef } from "react";

interface ProfileHeaderProps {
  photoPreview: string | null;
  profilePhotoUrl: string | null;
  uploading: boolean;
  handlePhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  canEdit?: boolean;
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
  handlePhotoUpload,
  canEdit = false,
}) => {
  const hasPhoto = !!photoPreview || !!profilePhotoUrl;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trick: allow selecting the same file again by resetting file input after use
  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handlePhotoUpload(event);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // reset file input so re-uploading same file triggers change
    }
  };

  // When editable, clicking the avatar triggers the file picker
  const handleAvatarClick = () => {
    if (canEdit && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 pt-8" style={{ background: "transparent", boxShadow: "none" }}>
      <div
        className={`
          relative
          ${canEdit ? "cursor-pointer group focus-within:ring-2 focus-within:ring-green-600" : ""}
        `}
        tabIndex={canEdit ? 0 : -1}
        onClick={handleAvatarClick}
        onKeyDown={e => {
          if (canEdit && (e.key === "Enter" || e.key === " ")) handleAvatarClick();
        }}
        aria-label={canEdit ? "Change profile photo" : "Profile photo"}
        role={canEdit ? "button" : undefined}
        style={{ background: "transparent", boxShadow: "none" }}
      >
        {/* Avatar circle with green border, absolutely NO background, shadow, or padding */}
        <div
          className={
            "w-40 h-40 md:w-52 md:h-52 rounded-full border-4 border-green-700 overflow-hidden flex items-center justify-center object-cover transition-all relative duration-200" +
            (canEdit ? " group-hover:ring-4 group-hover:ring-green-500 group-hover:ring-offset-2" : "")
          }
          style={{
            background: "transparent",
            boxShadow: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {hasPhoto ? (
            <img
              src={photoPreview || profilePhotoUrl!}
              alt="Profile"
              className="w-full h-full object-cover select-none"
              draggable={false}
              style={{ background: "transparent" }}
            />
          ) : (
            <UserPlaceholderIcon />
          )}
          {/* When editable: show a dim overlay + "Change" label on hover */}
          {canEdit && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="bg-white/80 text-green-900 text-xs px-3 py-1 rounded-full font-medium shadow">
                Change photo
              </span>
            </div>
          )}
        </div>
        {/* Hidden input covers avatar when editing */}
        {canEdit && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={uploading}
            tabIndex={-1}
            aria-label="Upload profile photo"
          />
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
