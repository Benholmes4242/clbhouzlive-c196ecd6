import React, { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Crop } from "lucide-react";
import HandicapEditModal from "./HandicapEditModal";
import MobileCropTool from "./MobileCropTool";
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [showMobileCrop, setShowMobileCrop] = useState(false);
  const [mobileCropData, setMobileCropData] = useState(() => {
    if (profile?.mobile_crop_data) {
      try {
        return JSON.parse(profile.mobile_crop_data);
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleHandicapUpdate = (newHandicap: number | null) => {
    // Only update the local form state - no need to trigger full profile refetch
    onHandicapChange(newHandicap?.toString() || "");
  };

  const handleMobileCropSave = (cropData: any) => {
    setMobileCropData(cropData);
    setShowMobileCrop(false);
    
    // Show success message
    toast({
      title: "Mobile crop saved",
      description: "Your mobile profile photo crop has been updated successfully.",
    });
    
    // TODO: Save crop data to profile
    console.log('Saving mobile crop data:', cropData);
  };

  const handleMobileCropClick = () => {
    const imageUrl = getCurrentImageUrl();
    if (!imageUrl) {
      toast({
        title: "Upload a profile photo first under Desktop profile photo.",
        variant: "destructive",
      });
      return;
    }
    setShowMobileCrop(true);
  };

  const getCurrentImageUrl = () => {
    if (formData.profilePhoto) {
      return URL.createObjectURL(formData.profilePhoto);
    }
    return profile?.profile_photo_url || '';
  };

  const getMobileCropStyle = () => {
    if (!mobileCropData) return { objectPosition: 'center center' };
    
    const centerX = mobileCropData.x + mobileCropData.width / 2;
    const centerY = mobileCropData.y + mobileCropData.height / 2;
    
    return {
      objectPosition: `${centerX}% ${centerY}%`,
      transform: `scale(${100 / mobileCropData.width})`
    };
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
      <div className="space-y-4">
        <Label className="text-base font-semibold">Profile Photo</Label>
        
        {/* Option 1: Desktop profile photo & crop */}
        <div className="space-y-3 p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="profilePhoto" className="text-sm font-medium">
              Desktop profile photo & crop
            </Label>
            <p className="text-xs text-muted-foreground">
              This controls how your profile photo appears on desktop.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {(profile?.profile_photo_url || formData.profilePhoto) && (
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                <img 
                  src={formData.profilePhoto ? URL.createObjectURL(formData.profilePhoto) : profile?.profile_photo_url} 
                  alt="Profile photo preview" 
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
              {formData.profilePhoto && (
                <p className="text-xs text-green-600 mt-1">
                  File selected: {formData.profilePhoto.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Option 2: Mobile profile photo crop */}
        <div className="space-y-3 p-4 border rounded-lg">
          <div className="space-y-1">
            <Label className="text-sm font-medium">
              Mobile profile photo crop
            </Label>
            <p className="text-xs text-muted-foreground">
              This controls which part of the same photo appears on your mobile profile.
            </p>
          </div>
          
          {(profile?.profile_photo_url || formData.profilePhoto) ? (
            <div className="space-y-3">
              {/* Mobile crop controls */}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMobileCropClick}
                  className="gap-2"
                >
                  <Crop className="w-4 h-4" />
                  Adjust Mobile Crop
                </Button>
                {mobileCropData && (
                  <span className="text-xs text-green-600">
                    Custom crop applied
                  </span>
                )}
              </div>
              
              {/* Preview of current mobile crop */}
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium">Mobile preview:</p>
                  <div className="w-16 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    <img 
                      src={getCurrentImageUrl()} 
                      alt="Mobile crop preview" 
                      className="w-full h-full object-cover"
                      style={getMobileCropStyle()}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>This is how your photo will appear</p>
                  <p>in the mobile header (3:4 aspect ratio)</p>
                  {mobileCropData && (
                    <div className="mt-2 text-xs">
                      <p>Crop: {mobileCropData.x.toFixed(1)}%, {mobileCropData.y.toFixed(1)}%</p>
                      <p>Size: {mobileCropData.width.toFixed(1)}% × {mobileCropData.height.toFixed(1)}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded">
              Upload your profile photo in the Desktop option first.
            </div>
          )}
        </div>
      </div>

      {/* Header Photo Upload */}
      <div className="space-y-2">
        <Label htmlFor="headerPhoto">Header Photo</Label>
        <div className="flex items-center gap-4">
          {(profile?.header_photo_url || formData.headerPhoto) && (
            <div className="w-20 h-12 rounded overflow-hidden bg-gray-200 flex-shrink-0">
              <img 
                src={formData.headerPhoto ? URL.createObjectURL(formData.headerPhoto) : profile?.header_photo_url} 
                alt="Header photo preview" 
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
            {formData.headerPhoto && (
              <p className="text-xs text-green-600 mt-1">
                File selected: {formData.headerPhoto.name}
              </p>
            )}
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

      {/* Mobile Crop Tool Modal */}
      {showMobileCrop && getCurrentImageUrl() && (
        <MobileCropTool
          imageUrl={getCurrentImageUrl()}
          initialCrop={mobileCropData}
          onSave={handleMobileCropSave}
          onCancel={() => setShowMobileCrop(false)}
          userId={userId}
        />
      )}
    </div>
  );
};

export default ProfileFormFields;