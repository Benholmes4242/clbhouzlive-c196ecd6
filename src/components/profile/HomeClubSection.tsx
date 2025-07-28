
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface HomeClubSectionProps {
  editingClub: boolean;
  clubInput: string;
  homeClub: string | null;
  onEditClick: () => void;
  onCancel: () => void;
  onInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  setClubInput: (v: string) => void;
}

const HomeClubSection: React.FC<HomeClubSectionProps> = ({
  editingClub,
  clubInput,
  homeClub,
  onEditClick,
  onCancel,
  onInput,
  onSave,
}) => (
  <div className="mt-6 flex flex-col items-center">
    <div className="flex items-center gap-2">
      <Label className="text-md">Home Club:</Label>
      {editingClub ? (
        <>
          <Input
            value={clubInput}
            onChange={onInput}
            className="max-w-xs"
          />
          <Button size="sm" onClick={onSave}>Save</Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
        </>
      ) : (
        <>
          <span className="font-semibold px-2 text-black">{homeClub || "Not set"}</span>
          <Button variant="ghost" size="sm" onClick={onEditClick}>Edit</Button>
        </>
      )}
    </div>
  </div>
);

export default HomeClubSection;
