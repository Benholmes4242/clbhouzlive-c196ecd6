
import React, { useRef } from "react";
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
import { Button } from "@/components/ui/button";
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
  profile?: {
    profile_photo_url?: string;
    cover_photo_url?: string;
  } | null;
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

  const handleFileInputChange = (field: 'profilePhoto' | 'headerPhoto') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file && field === 'headerPhoto') {
      // Validate header photo file type
      const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('Header photo must be an image file (PNG, JPEG, WebP, or GIF)');
        return;
      }
    }
    
    onFileChange(field, file);
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

      {/* Profile Photo Field */}
      <div className="space-y-2">
        <Label htmlFor="profilePhoto">Profile Photo</Label>
        <div className="flex items-center gap-4">
          {(profile?.profile_photo_url || formData.profilePhoto) && (
            <div className="flex-shrink-0">
              <img
                src={formData.profilePhoto ? URL.createObjectURL(formData.profilePhoto) : profile?.profile_photo_url}
                alt="Profile preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            </div>
          )}
          <div className="flex-1">
            <Input
              id="profilePhoto"
              type="file"
              accept="image/*"
              onChange={handleFileInputChange('profilePhoto')}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('profilePhoto')?.click()}
              className="w-full"
            >
              Change profile photo
            </Button>
          </div>
        </div>
      </div>

      {/* Header Photo Field */}
      <div className="space-y-2">
        <Label htmlFor="headerPhoto">Header Photo</Label>
        <div className="flex flex-col gap-3">
          {(profile?.cover_photo_url || formData.headerPhoto) && (
            <div className="w-full h-20 rounded-lg overflow-hidden border-2 border-gray-200">
              <img
                src={formData.headerPhoto ? URL.createObjectURL(formData.headerPhoto) : profile?.cover_photo_url}
                alt="Header preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <Input
              id="headerPhoto"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileInputChange('headerPhoto')}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('headerPhoto')?.click()}
              className="w-full"
            >
              Change header photo
            </Button>
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
