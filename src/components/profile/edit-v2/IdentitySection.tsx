import React from 'react';
import { Lock, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionHeader } from './SectionHeader';

interface IdentitySectionProps {
  displayName: string;
  username: string;
  isUsernameSet: boolean;
  onChange: (field: string, value: string) => void;
}

export const IdentitySection: React.FC<IdentitySectionProps> = ({
  displayName,
  username,
  isUsernameSet,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<User className="w-5 h-5 text-primary" />}
        title="Basic Info"
        subtitle="How you appear on Clbhouz"
      />

      <div className="space-y-5">
        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-sm font-semibold text-foreground">
            Display Name
          </Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => onChange('displayName', e.target.value)}
            placeholder="Your name"
            className="h-12 text-base border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            This is how your name appears to others
          </p>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="username" className="text-sm font-semibold text-foreground">
              Username
            </Label>
            {isUsernameSet && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" />
                Locked
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base">
              @
            </span>
            <Input
              id="username"
              value={username}
              onChange={(e) => onChange('username', e.target.value)}
              placeholder="username"
              disabled={isUsernameSet}
              className="pl-8 h-12 text-base border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {!isUsernameSet && (
            <p className="text-xs text-muted-foreground">
              Choose carefully — usernames cannot be changed after being set.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
