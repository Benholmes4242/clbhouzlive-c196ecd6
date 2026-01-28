import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { User, MapPin, TrendingDown } from 'lucide-react';

interface PersonalFieldsFormProps {
  displayName?: string;
  username?: string;
  homeClub: string;
  handicap: string;
  isUsernameSet?: boolean;
  onChange: (field: string, value: string) => void;
}

export const PersonalFieldsForm: React.FC<PersonalFieldsFormProps> = ({
  displayName,
  username,
  homeClub,
  handicap,
  isUsernameSet = false,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Identity Section */}
      {(displayName !== undefined || username !== undefined) && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <User className="w-4 h-4" />
            <h3 className="font-medium">Identity</h3>
          </div>
          
          {displayName !== undefined && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => onChange('displayName', e.target.value)}
                placeholder="Your name"
              />
            </div>
          )}

          {username !== undefined && (
            <div className="space-y-2">
              <Label htmlFor="username">
                Username
                {isUsernameSet && (
                  <span className="ml-2 text-xs text-muted-foreground">(locked)</span>
                )}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => onChange('username', e.target.value.replace(/\s+/g, '').replace('@', ''))}
                  placeholder="username"
                  disabled={isUsernameSet}
                  className="pl-8"
                />
              </div>
              {!isUsernameSet && (
                <p className="text-xs text-muted-foreground">
                  Choose carefully — usernames cannot be changed after being set.
                </p>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Golf Information Section */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <MapPin className="w-4 h-4" />
          <h3 className="font-medium">Golf Information</h3>
        </div>
        
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
          <Label htmlFor="handicap" className="flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5" />
            Handicap Index
          </Label>
          <Input
            id="handicap"
            type="number"
            step="0.1"
            min="-10"
            max="54"
            value={handicap}
            onChange={(e) => onChange('handicap', e.target.value)}
            placeholder="e.g., 12.4"
          />
          <p className="text-xs text-muted-foreground">
            Your official handicap index (WHS)
          </p>
        </div>
      </Card>
    </div>
  );
};