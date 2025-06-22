
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { User, Building2 } from 'lucide-react';

interface UserTypeSelectorProps {
  userType: 'individual' | 'business';
  onUserTypeChange: (userType: 'individual' | 'business') => void;
}

const UserTypeSelector = ({ userType, onUserTypeChange }: UserTypeSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">What type of profile are you creating?</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={userType}
          onValueChange={(value) => onUserTypeChange(value as 'individual' | 'business')}
          className="space-y-4"
        >
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="individual" id="individual" />
            <Label htmlFor="individual" className="flex items-center space-x-3 cursor-pointer flex-1">
              <User className="h-6 w-6 text-primary" />
              <div>
                <div className="font-medium">I'm signing up for myself</div>
                <div className="text-sm text-muted-foreground">Individual player/golfer</div>
              </div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="business" id="business" />
            <Label htmlFor="business" className="flex items-center space-x-3 cursor-pointer flex-1">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <div className="font-medium">I'm signing up for a business or club</div>
                <div className="text-sm text-muted-foreground">Golf club, pro shop, academy, etc.</div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default UserTypeSelector;
