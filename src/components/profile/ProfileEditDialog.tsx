
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import ProfileFormFields from "./ProfileFormFields";
import { useProfileForm } from "./hooks/useProfileForm";

interface ProfileEditDialogProps {
  profile: {
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
  } | null;
  userId: string;
  onProfileUpdate: () => void;
}

const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({
  profile,
  userId,
  onProfileUpdate,
}) => {
  const [open, setOpen] = useState(false);

  const {
    formData,
    saving,
    isUsernameSet,
    handleInputChange,
    handleHandicapChange,
    handlePublicToggle,
    handleTextareaChange,
    handleSelectChange,
    handleFileChange,
    handleSave,
  } = useProfileForm(profile, userId, onProfileUpdate, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="w-4 h-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background border border-border">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <ProfileFormFields
          formData={formData}
          isUsernameSet={isUsernameSet}
          userId={userId}
          userType={profile?.user_type}
          profile={profile}
          onInputChange={handleInputChange}
          onTextareaChange={handleTextareaChange}
          onSelectChange={handleSelectChange}
          onHandicapChange={handleHandicapChange}
          onPublicToggle={handlePublicToggle}
          onFileChange={handleFileChange}
          onProfileUpdate={onProfileUpdate}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditDialog;
