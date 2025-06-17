
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
import { generateHandicapOptions } from "./utils/handicapOptions";

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
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onHandicapChange: (value: string) => void;
  onPublicToggle: (checked: boolean) => void;
}

const ProfileFormFields: React.FC<ProfileFormFieldsProps> = ({
  formData,
  isUsernameSet,
  onInputChange,
  onHandicapChange,
  onPublicToggle,
}) => {
  const handicapOptions = generateHandicapOptions();

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
        <Label htmlFor="handicap">Handicap</Label>
        <Select value={formData.handicap} onValueChange={onHandicapChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select your handicap" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {handicapOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
