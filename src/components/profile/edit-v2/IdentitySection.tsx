import React from 'react';
import { User, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
    <Card className="overflow-hidden bg-white shadow-sm">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Identity</h3>
            <p className="text-sm text-muted-foreground">
              How you appear on Clbhouz
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => onChange('displayName', e.target.value)}
              placeholder="Your name"
              className="h-11"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="username">Username</Label>
              {isUsernameSet && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
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
                className="pl-7 h-11"
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
    </Card>
  );
};
