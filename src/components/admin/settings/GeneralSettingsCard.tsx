
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const GeneralSettingsCard = () => {
  
  const [siteName, setSiteName] = useState('clbhouz');
  const [siteDescription, setSiteDescription] = useState('The golf social network');
  const [contactEmail, setContactEmail] = useState('admin@clbhouz.com');
  const [isLoading, setIsLoading] = useState(false);

  // Load saved settings on component mount
  useEffect(() => {
    const savedSiteName = localStorage.getItem('general_site_name');
    const savedSiteDescription = localStorage.getItem('general_site_description');
    const savedContactEmail = localStorage.getItem('general_contact_email');

    if (savedSiteName) setSiteName(savedSiteName);
    if (savedSiteDescription) setSiteDescription(savedSiteDescription);
    if (savedContactEmail) setContactEmail(savedContactEmail);
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Save to localStorage
      localStorage.setItem('general_site_name', siteName);
      localStorage.setItem('general_site_description', siteDescription);
      localStorage.setItem('general_contact_email', contactEmail);

      toast.success("Settings saved");
    } catch (error) {
      toast.error("Couldn't save settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="site-name">Site Name</Label>
          <Input 
            id="site-name" 
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-description">Site Description</Label>
          <Input 
            id="site-description" 
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Contact Email</Label>
          <Input 
            id="contact-email" 
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
        <div className="pt-4">
          <Button 
            onClick={handleSave}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Saving...' : 'Save General Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralSettingsCard;
