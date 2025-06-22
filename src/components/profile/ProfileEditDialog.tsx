
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
import UpdateUsernameDialog from "./UpdateUsernameDialog";
import { useProfileForm } from "./hooks/useProfileForm";

interface ProfileEditDialogProps {
  profile: {
    display_name?: string | null;
    username?: string | null;
    home_club?: string | null;
    eg_handicap_index?: number | null;
    is_public?: boolean | null;
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
    handleSave,
  } = useProfileForm(profile, userId, onProfileUpdate, () => setOpen(false));

  return (
    <div className="flex gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="w-4 h-4" />
            Edit Profile
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <ProfileFormFields
            formData={formData}
            isUsernameSet={isUsernameSet}
            onInputChange={handleInputChange}
            onHandicapChange={handleHandicapChange}
            onPublicToggle={handlePublicToggle}
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
      
      <UpdateUsernameDialog
        userId={userId}
        currentUsername={profile?.username}
        onUpdate={onProfileUpdate}
      />
    </div>
  );
};

export default ProfileEditDialog;
