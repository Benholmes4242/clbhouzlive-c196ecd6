import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface PrivacySectionProps {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
}

export const PrivacySection: React.FC<PrivacySectionProps> = ({
  isPublic,
  onChange,
}) => {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-medium">Privacy</h2>
        <p className="text-xs text-muted-foreground">Control who can see your profile.</p>
      </div>

      <div className="flex items-center justify-between py-1">
        <div className="space-y-0.5">
          <Label htmlFor="public-profile" className="text-sm font-normal">
            Public Profile
          </Label>
          <p className="text-[11px] text-muted-foreground max-w-xs">
            When your profile is public, anyone on Clbhouz can view your posts and golf journey.
          </p>
        </div>
        <Switch
          id="public-profile"
          checked={isPublic}
          onCheckedChange={onChange}
          className="data-[state=checked]:bg-[#6e7071]"
        />
      </div>
    </div>
  );
};
