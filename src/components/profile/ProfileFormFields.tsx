
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
import { Textarea } from "@/components/ui/textarea";
import HandicapEditModal from "./HandicapEditModal";

interface ProfileFormData {
  displayName: string;
  username: string;
  homeClub: string;
  handicap: string;
  isPublic: boolean;
  businessName: string;
  businessType: string;
  contactPersonName: string;
  phone: string;
  websiteUrl: string;
  location: string;
  bio: string;
  profilePhoto: File | null;
  headerPhoto: File | null;
}

interface ProfileFormFieldsProps {
  formData: ProfileFormData;
  isUsernameSet: boolean;
  userId: string;
  userType?: string;
  profile?: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onHandicapChange: (value: string) => void;
  onPublicToggle: (checked: boolean) => void;
  onFileChange: (field: 'profilePhoto' | 'headerPhoto', file: File | null) => void;
  onProfileUpdate: () => void;
}

const ProfileFormFields: React.FC<ProfileFormFieldsProps> = ({
  formData,
  isUsernameSet,
  userId,
  userType = 'individual',
  profile,
  onInputChange,
  onTextareaChange,
  onSelectChange,
  onHandicapChange,
  onPublicToggle,
  onFileChange,
  onProfileUpdate,
}) => {
  // All profiles are now personal profiles
  const isPersonalProfile = true;

  const handleHandicapUpdate = (newHandicap: number | null) => {
    // Only update the local form state - no need to trigger full profile refetch
    onHandicapChange(newHandicap?.toString() || "");
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">
          Display Name
        </Label>
        <Input
          id="displayName"
          name="displayName"
          value={formData.displayName}
          onChange={onInputChange}
          placeholder="Your display name"
        />
      </div>

      {/* Profile Photo Upload */}
      <div className="space-y-2">
        <Label htmlFor="profilePhoto">Profile Photo</Label>
        <div className="flex items-center gap-4">
          {profile?.profile_photo_url && (
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
              <img 
                src={profile.profile_photo_url} 
                alt="Current profile" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <Input
              id="profilePhoto"
              type="file"
              accept="image/*"
              onChange={(e) => onFileChange('profilePhoto', e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Square images work best for profile photos
            </p>
          </div>
        </div>
      </div>

      {/* Header Photo Upload */}
      <div className="space-y-2">
        <Label htmlFor="headerPhoto">Header Photo</Label>
        <div className="flex items-center gap-4">
          {profile?.header_photo_url && (
            <div className="w-20 h-12 rounded overflow-hidden bg-gray-200">
              <img 
                src={profile.header_photo_url} 
                alt="Current header" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <Input
              id="headerPhoto"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => onFileChange('headerPhoto', e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Images only. Recommended 1600×600+
            </p>
          </div>
        </div>
      </div>

      {/* Username - common for both types */}
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

      {/* Personal profile fields */}
      {isPersonalProfile && (
        <>
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
        </>
      )}

      {/* Bio - common for both types */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={onTextareaChange}
          placeholder="Tell us about yourself..."
          className="min-h-[80px]"
        />
      </div>

      {/* Public Profile toggle - common for both types */}
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
