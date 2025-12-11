import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
    <Card className="overflow-hidden bg-white shadow-sm">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            {isPublic ? (
              <Eye className="w-5 h-5 text-muted-foreground" />
            ) : (
              <EyeOff className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-base">Privacy</h3>
            <p className="text-sm text-muted-foreground">
              Control who can see your profile
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <Label htmlFor="public-profile" className="text-sm font-medium">
              Public Profile
            </Label>
            <p className="text-xs text-muted-foreground max-w-xs">
              When your profile is public, anyone on Clbhouz can view your posts and golf journey.
            </p>
          </div>
          <Switch
            id="public-profile"
            checked={isPublic}
            onCheckedChange={onChange}
          />
        </div>
      </div>
    </Card>
  );
};
