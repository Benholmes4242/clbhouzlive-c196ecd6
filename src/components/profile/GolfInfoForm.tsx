
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GolfInfoFormProps {
  formData: {
    handicap: string;
    favoriteClub: string;
    yearsPlaying: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const GolfInfoForm: React.FC<GolfInfoFormProps> = ({ formData, onChange }) => {
  // Format handicap display helper
  const formatHandicapPlaceholder = () => {
    return "e.g., 15 or +2.5 for scratch golfers";
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Golf Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="handicap">Handicap Index</Label>
          <Input
            id="handicap"
            name="handicap"
            value={formData.handicap}
            onChange={onChange}
            placeholder={formatHandicapPlaceholder()}
            type="text"
          />
          <p className="text-xs text-muted-foreground mt-1">
            For scratch golfers or better, use + format (e.g., +2.5)
          </p>
        </div>
      </div>
      <div>
        <Label htmlFor="favoriteClub">Home Club/Course</Label>
        <Input
          id="favoriteClub"
          name="favoriteClub"
          value={formData.favoriteClub}
          onChange={onChange}
          placeholder="Your home club or course"
        />
      </div>
    </div>
  );
};

export default GolfInfoForm;
