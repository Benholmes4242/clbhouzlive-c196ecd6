import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

import { useEditProfileForm } from "./hooks/useEditProfileForm";
import { HeaderPhotoSection } from "./components/HeaderPhotoSection";
import { MiniCardSection } from "./components/MiniCardSection";
import { BioWebsitesSection } from "./components/BioWebsitesSection";
import { LivePreviewSection } from "./components/LivePreviewSection";

interface Profile {
  display_name?: string | null;
  username?: string | null;
  home_club?: string | null;
  eg_handicap_index?: number | null;
  is_public?: boolean | null;
  user_type?: string | null;
  business_name?: string | null;
  business_type?: string | null;
  contact_person_name?: string | null;
  phone?: string | null;
  website_url?: string | null;
  location?: string | null;
  bio?: string | null;
  profile_photo_url?: string | null;
  header_photo_url?: string | null;
  websites?: string[] | null;
  mobile_crop_x?: number | null;
  mobile_crop_y?: number | null;
  mobile_crop_width?: number | null;
  mobile_crop_height?: number | null;
  desktop_crop_x?: number | null;
  desktop_crop_y?: number | null;
  desktop_crop_width?: number | null;
  desktop_crop_height?: number | null;
  mini_card_crop_x?: number | null;
  mini_card_crop_y?: number | null;
  mini_card_crop_width?: number | null;
  mini_card_crop_height?: number | null;
}

interface EditProfileModalProps {
  profile: Profile | null;
  userId: string;
  onProfileUpdate: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  profile,
  userId,
  onProfileUpdate,
}) => {
  const [open, setOpen] = useState(false);
  const [activePreviewMode, setActivePreviewMode] = useState<'mobile' | 'desktop'>('mobile');

  const {
    formData,
    saving,
    isUsernameSet,
    handleInputChange,
    handleHandicapChange,
    handlePublicToggle,
    handleTextareaChange,
    handleFileChange,
    handleWebsitesChange,
    handleHeaderMobileCropChange,
    handleHeaderDesktopCropChange,
    handleMiniCardCropChange,
    handleSave,
  } = useEditProfileForm(profile, userId, onProfileUpdate, () => setOpen(false));

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="w-4 h-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-background border border-border">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form content - 2/3 width on desktop */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Photo Section */}
            <HeaderPhotoSection
              headerPhoto={formData.headerPhoto}
              headerPhotoUrl={profile?.header_photo_url}
              mobileCrop={{
                x: formData.mobileCropX,
                y: formData.mobileCropY,
                width: formData.mobileCropWidth,
                height: formData.mobileCropHeight,
              }}
              desktopCrop={{
                x: formData.desktopCropX,
                y: formData.desktopCropY,
                width: formData.desktopCropWidth,
                height: formData.desktopCropHeight,
              }}
              onFileChange={(file) => handleFileChange('headerPhoto', file)}
              onMobileCropChange={handleHeaderMobileCropChange}
              onDesktopCropChange={handleHeaderDesktopCropChange}
            />

            {/* Mini Profile Card Section */}
            <MiniCardSection
              profilePhoto={formData.profilePhoto}
              profilePhotoUrl={profile?.profile_photo_url}
              miniCardCrop={{
                x: formData.miniCardCropX,
                y: formData.miniCardCropY,
                width: formData.miniCardCropWidth,
                height: formData.miniCardCropHeight,
              }}
              onFileChange={(file) => handleFileChange('profilePhoto', file)}
              onCropChange={handleMiniCardCropChange}
            />

            {/* Bio & Websites Section */}
            <BioWebsitesSection
              bio={formData.bio}
              websites={formData.websites}
              onBioChange={(bio) => handleTextareaChange({ target: { name: 'bio', value: bio } } as any)}
              onWebsitesChange={handleWebsitesChange}
            />
          </div>

          {/* Live Preview - 1/3 width on desktop, full width on mobile */}
          <div className="lg:col-span-1">
            <LivePreviewSection
              formData={formData}
              profile={profile}
              activeMode={activePreviewMode}
              onModeChange={setActivePreviewMode}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} variant="outline">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};