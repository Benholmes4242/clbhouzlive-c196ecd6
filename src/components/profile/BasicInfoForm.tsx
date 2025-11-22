
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BasicInfoFormProps {
  formData: {
    name: string;
    username: string;
    bio: string;
    location: string;
    homeClub: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ formData, onChange }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="name">Full Name</Label>
      <Input
        id="name"
        name="name"
        value={formData.name}
        onChange={onChange}
        placeholder="Enter your full name"
        required
      />
    </div>
    <div>
      <Label htmlFor="homeClub">Home Golf Club</Label>
      <Input
        id="homeClub"
        name="homeClub"
        value={formData.homeClub}
        onChange={onChange}
        placeholder="Enter your home golf club or 'Not applicable'"
      />
      <p className="text-body-sm text-muted-foreground mt-1">
        Enter your home golf club name, or type "Not applicable" if you don't have one
      </p>
    </div>
    <div>
      <Label htmlFor="bio">Bio</Label>
      <Textarea
        id="bio"
        name="bio"
        value={formData.bio}
        onChange={onChange}
        placeholder="Tell us about yourself and your golf journey..."
        rows={3}
      />
    </div>
    <div>
      <Label htmlFor="location">City or Country</Label>
      <Input
        id="location"
        name="location"
        value={formData.location}
        onChange={onChange}
        placeholder="City or Country"
      />
    </div>
  </div>
);

export default BasicInfoForm;
