
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const GeneralSettingsCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="site-name">Site Name</Label>
          <Input id="site-name" defaultValue="clbhouz" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-description">Site Description</Label>
          <Input id="site-description" defaultValue="The golf social network" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Contact Email</Label>
          <Input id="contact-email" defaultValue="admin@clbhouz.com" />
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralSettingsCard;
