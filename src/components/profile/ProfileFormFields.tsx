
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import HandicapEditModal from "./HandicapEditModal";

interface ProfileFormData {
  displayName: string;
  username: string;
  homeClub: string;
  handicap: string;
  isPublic: boolean;
}

interface ProfileFormFieldsProps {
  formData: ProfileFormData;
  isUsernameSet: boolean;
  userId: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onHandicapChange: (value: string) => void;
  onPublicToggle: (checked: boolean) => void;
  onProfileUpdate: () => void;
}

const ProfileFormFields: React.FC<ProfileFormFieldsProps> = ({
  formData,
  isUsernameSet,
  userId,
  onInputChange,
  onHandicapChange,
  onPublicToggle,
  onProfileUpdate,
}) => {
  const handleHandicapUpdate = (newHandicap: number | null) => {
    // Update the local form state
    onHandicapChange(newHandicap?.toString() || "");
    // Trigger parent update without full page refresh
    onProfileUpdate();
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          name="displayName"
          value={formData.displayName}
          onChange={onInputChange}
          placeholder="Your display name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          value={formData.username}
          onChange={onInputChange}
          placeholder="Your username"
          disabled={isUsernameSet}
          className={isUsernameSet ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}
        />
        {isUsernameSet && (
          <p className="text-xs text-gray-500">Username cannot be changed once set</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="homeClub">Home Club</Label>
        <Input
          id="homeClub"
          name="homeClub"
          value={formData.homeClub}
          onChange={onInputChange}
          placeholder="Your home golf club"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="handicap">Handicap</Label>
          <HandicapEditModal
            userId={userId}
            currentHandicap={formData.handicap ? parseFloat(formData.handicap) : null}
            onHandicapUpdate={handleHandicapUpdate}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {formData.handicap ? `Current handicap: ${formData.handicap}` : 'No handicap set'}
        </div>
      </div>
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-1">
          <Label htmlFor="public-profile">Public Profile</Label>
          <p className="text-sm text-muted-foreground">
            Allow others to discover and view your profile
          </p>
        </div>
        <Switch
          id="public-profile"
          checked={formData.isPublic}
          onCheckedChange={onPublicToggle}
        />
      </div>
    </div>
  );
};

export default ProfileFormFields;
