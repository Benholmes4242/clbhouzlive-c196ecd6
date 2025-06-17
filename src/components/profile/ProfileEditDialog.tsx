
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileEditDialogProps {
  profile: {
    display_name?: string | null;
    username?: string | null;
    home_club?: string | null;
    eg_handicap_index?: number | null;
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
  const [formData, setFormData] = useState({
    displayName: profile?.display_name || "",
    username: profile?.username || "",
    homeClub: profile?.home_club || "",
    handicap: profile?.eg_handicap_index?.toString() || "",
  });
  const [saving, setSaving] = useState(false);

  // Check if username is already set (not null/empty) to determine if it should be read-only
  const isUsernameSet = profile?.username && profile.username.trim() !== "";

  // Generate handicap options from +10.0 to 50.0 in 0.1 increments
  const generateHandicapOptions = () => {
    const options = [];
    
    // Add positive handicaps from +10.0 down to +0.1
    for (let i = 100; i >= 1; i--) {
      const value = i / 10;
      options.push({
        value: (-value).toString(),
        label: `+${value.toFixed(1)}`
      });
    }
    
    // Add 0.0
    options.push({
      value: "0",
      label: "0.0"
    });
    
    // Add regular handicaps from 0.1 to 50.0
    for (let i = 1; i <= 500; i++) {
      const value = i / 10;
      options.push({
        value: value.toString(),
        label: value.toFixed(1)
      });
    }
    
    return options;
  };

  const handicapOptions = generateHandicapOptions();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHandicapChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      handicap: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {
        display_name: formData.displayName,
        home_club: formData.homeClub || null,
        eg_handicap_index: formData.handicap ? parseFloat(formData.handicap) : null,
        updated_at: new Date().toISOString(),
      };

      // Only update username if it's not already set
      if (!isUsernameSet) {
        updateData.username = formData.username || null;
      }

      await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

      onProfileUpdate();
      setOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="Your display name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
              placeholder="Your home golf club"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="handicap">Handicap</Label>
            <Select value={formData.handicap} onValueChange={handleHandicapChange}>
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
        </div>
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
