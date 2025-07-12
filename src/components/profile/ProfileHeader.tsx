
import React, { useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LazyImage from '@/components/ui/lazy-image';

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

  // When editable, clicking the avatar triggers the file picker
  // When not editable but has photo, clicking shows enlarged view
  const handleAvatarClick = () => {
    if (canEdit && !uploading) {
      console.log('Avatar clicked, triggering file input');
      fileInputRef.current?.click();
    } else if (hasPhoto) {
      setShowEnlargedPhoto(true);
    }
  };

  // Trick: allow selecting the same file again by resetting file input after use
  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed, files:', event.target.files);
    handlePhotoUpload(event);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // reset file input so re-uploading same file triggers change
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
          {/* Avatar circle, absolutely NO background, shadow, or padding */}
          <div
            className={
              "w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden flex items-center justify-center object-cover transition-all relative duration-200" +
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
              <LazyImage
                src={photoPreview || profilePhotoUrl!}
                alt="Profile"
                className="w-full h-full select-none"
                width={200}
                height={200}
                priority={true}
                quality="high"
              />
            ) : (
              <UserPlaceholderIcon />
            )}
            {/* When editable: show a dim overlay + "Change" label on hover */}
            {canEdit && !uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="bg-white/80 text-green-900 text-xs px-3 py-1 rounded-full font-medium shadow">
                  Change photo
                </span>
              </div>
            )}
            {/* Show uploading state */}
            {canEdit && uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span className="bg-white/80 text-green-900 text-xs px-3 py-1 rounded-full font-medium shadow">
                    Uploading...
                  </span>
                </div>
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
          {/* Hidden file input - positioned separately for better mobile compatibility */}
          {canEdit && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="sr-only"
              disabled={uploading}
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
              <LazyImage
                src={photoPreview || profilePhotoUrl!}
                alt="Profile photo"
                className="w-full h-full rounded-full shadow-2xl"
                width={320}
                height={320}
                priority={true}
                quality="high"
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
