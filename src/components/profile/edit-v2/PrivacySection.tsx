import React from 'react';
import { Shield, Globe, Lock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SectionHeader } from './SectionHeader';
import { cn } from '@/lib/utils';

interface PrivacySectionProps {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
}

export const PrivacySection: React.FC<PrivacySectionProps> = ({
  isPublic,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Shield className="w-5 h-5" />}
        title="Privacy"
        subtitle="Control who can see your profile"
        sectionType="privacy"
      />

      <div className={cn(
        "flex items-center justify-between p-4 rounded-xl border transition-all",
        isPublic 
          ? "bg-primary/5 border-primary/20" 
          : "bg-card border-border"
      )}>
        <div className="flex items-center gap-3">
          {isPublic ? (
            <Globe className="w-5 h-5 text-primary" />
          ) : (
            <Lock className="w-5 h-5 text-muted-foreground" />
          )}
          <div className="space-y-0.5">
            <Label htmlFor="public-profile" className="text-sm font-semibold text-foreground cursor-pointer">
              {isPublic ? 'Public Profile' : 'Private Profile'}
            </Label>
            <p className="text-xs text-muted-foreground max-w-xs">
              {isPublic 
                ? 'Anyone on Clbhouz can view your posts and golf journey.'
                : 'Only approved followers can see your profile.'
              }
            </p>
          </div>
        </div>
        <Switch
          id="public-profile"
          checked={isPublic}
          onCheckedChange={onChange}
          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
        />
      </div>
    </div>
  );
};
