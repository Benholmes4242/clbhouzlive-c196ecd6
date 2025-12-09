import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PersonalFieldsFormProps {
  homeClub: string;
  handicap: string;
  onChange: (field: string, value: string) => void;
}

export const PersonalFieldsForm: React.FC<PersonalFieldsFormProps> = ({
  homeClub,
  handicap,
  onChange,
}) => {
  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-sq-md border border-border">
      <h3 className="font-medium text-foreground">Golf Information</h3>
      
      <div className="space-y-2">
        <Label htmlFor="homeClub">Home Club</Label>
        <Input
          id="homeClub"
          value={homeClub}
          onChange={(e) => onChange('homeClub', e.target.value)}
          placeholder="Your home golf club"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="handicap">Handicap Index</Label>
        <Input
          id="handicap"
          type="number"
          step="0.1"
          value={handicap}
          onChange={(e) => onChange('handicap', e.target.value)}
          placeholder="e.g., 12.4"
        />
      </div>
    </div>
  );
};
