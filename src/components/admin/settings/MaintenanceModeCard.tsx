
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const MaintenanceModeCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Mode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Enable Maintenance Mode</Label>
            <p className="text-sm text-muted-foreground">Temporarily disable site access</p>
          </div>
          <Switch />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maintenance-message">Maintenance Message</Label>
          <Input 
            id="maintenance-message" 
            defaultValue="We're currently performing maintenance. Please check back soon!"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceModeCard;
