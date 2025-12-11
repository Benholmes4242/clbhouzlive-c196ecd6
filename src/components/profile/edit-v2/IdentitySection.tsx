import React from 'react';
import { Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-medium">Basic info</h2>
        <p className="text-xs text-muted-foreground">How you appear on Clbhouz.</p>
      </div>

      <div className="space-y-4">
        {/* Display Name */}
        <div className="space-y-1.5">
          <Label htmlFor="displayName" className="text-xs text-muted-foreground">
            Display Name
          </Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => onChange('displayName', e.target.value)}
            placeholder="Your name"
            className="h-10"
          />
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="username" className="text-xs text-muted-foreground">
              Username
            </Label>
            {isUsernameSet && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70">
                <Lock className="w-3 h-3" />
                Locked
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              @
            </span>
            <Input
              id="username"
              value={username}
              onChange={(e) => onChange('username', e.target.value)}
              placeholder="username"
              disabled={isUsernameSet}
              className="pl-7 h-10"
            />
          </div>
          {!isUsernameSet && (
            <p className="text-[11px] text-muted-foreground">
              Choose carefully — usernames cannot be changed after being set.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
