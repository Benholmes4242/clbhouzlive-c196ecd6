
import React, { useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import HighQualityImage from '@/components/ui/high-quality-image';

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
  const [showEnlargedPhoto, setShowEnlargedPhoto] = useState(false);

  // Trick: allow selecting the same file again by resetting file input after use
  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handlePhotoUpload(event);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // reset file input so re-uploading same file triggers change
    }
  };

  // When editable, clicking the avatar triggers the file picker
  // When not editable but has photo, clicking shows enlarged view
  const handleAvatarClick = () => {
    if (canEdit && !uploading) {
      fileInputRef.current?.click();
    } else if (hasPhoto) {
      setShowEnlargedPhoto(true);
    }
  };

  const shouldShowClickCursor = canEdit || hasPhoto;

  return (
    <>
      <div className="flex flex-col items-center gap-3 pt-8" style={{ background: "transparent", boxShadow: "none" }}>
        <div
          className={`
            relative
            ${shouldShowClickCursor ? "cursor-pointer group focus-within:ring-2 focus-within:ring-green-600" : ""}
          `}
          tabIndex={shouldShowClickCursor ? 0 : -1}
          onClick={handleAvatarClick}
          onKeyDown={e => {
            if (shouldShowClickCursor && (e.key === "Enter" || e.key === " ")) handleAvatarClick();
          }}
          aria-label={canEdit ? "Change profile photo" : hasPhoto ? "View profile photo" : "Profile photo"}
          role={shouldShowClickCursor ? "button" : undefined}
          style={{ background: "transparent", boxShadow: "none" }}
        >
          {/* Avatar circle with green border, absolutely NO background, shadow, or padding */}
          <div
            className={
              "w-40 h-40 md:w-52 md:h-52 rounded-[18px] border-4 border-black overflow-hidden flex items-center justify-center object-cover transition-all relative duration-200" +
              (shouldShowClickCursor ? " group-hover:opacity-80" : "")
            }
            style={{
              background: "transparent",
              boxShadow: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {hasPhoto ? (
              <HighQualityImage
                src={photoPreview || profilePhotoUrl!}
                alt="Profile"
                className="w-full h-full select-none"
                width={200}
                height={200}
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
            {/* When not editable but has photo: show view overlay */}
            {!canEdit && hasPhoto && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="bg-white/80 text-green-900 text-xs px-3 py-1 rounded-full font-medium shadow">
                  View photo
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

      {/* Enlarged photo dialog */}
      {hasPhoto && (
        <Dialog open={showEnlargedPhoto} onOpenChange={setShowEnlargedPhoto}>
          <DialogContent className="max-w-fit w-auto p-0 bg-transparent border-none shadow-none">
            <div className="w-80 h-80 mx-auto relative">
              <HighQualityImage
                src={photoPreview || profilePhotoUrl!}
                alt="Profile photo"
                className="w-full h-full rounded-[18px] shadow-2xl"
                width={320}
                height={320}
              />
              {/* Custom close button positioned outside the circle */}
              <button
                onClick={() => setShowEnlargedPhoto(false)}
                className="absolute -top-2 -right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m18 6-12 12" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ProfileHeader;
