
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Upload, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminSettings = () => {
  const { toast } = useToast();
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconUrl, setFaviconUrl] = useState('');
  const [tabTitle, setTabTitle] = useState('clbhouz - The Golfer\'s Social Hub');

  const handleFaviconFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's an image file
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file (PNG, JPG, etc.)",
          variant: "destructive",
        });
        return;
      }
      setFaviconFile(file);
      setFaviconUrl(''); // Clear URL if file is selected
    }
  };

  const handleUpdateBranding = () => {
    // Update the document title
    if (tabTitle.trim()) {
      document.title = tabTitle;
      
      // Update the title meta tag in the head
      const titleElement = document.querySelector('title');
      if (titleElement) {
        titleElement.textContent = tabTitle;
      }
    }

    // Handle favicon update
    if (faviconFile) {
      // Create a URL for the uploaded file
      const fileUrl = URL.createObjectURL(faviconFile);
      updateFaviconInHead(fileUrl);
      
      toast({
        title: "Success",
        description: "Favicon and tab title updated successfully! Note: Favicon file uploads require deployment to be permanent.",
      });
    } else if (faviconUrl.trim()) {
      updateFaviconInHead(faviconUrl);
      
      toast({
        title: "Success",
        description: "Favicon and tab title updated successfully!",
      });
    } else {
      toast({
        title: "Success", 
        description: "Tab title updated successfully!",
      });
    }
  };

  const updateFaviconInHead = (url: string) => {
    // Remove existing favicon links
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(link => link.remove());

    // Create new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = url;
    link.type = url.endsWith('.ico') ? 'image/x-icon' : 'image/png';
    document.head.appendChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-muted-foreground">Configure your platform settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Site Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tab-title">Tab Title</Label>
              <Input 
                id="tab-title" 
                value={tabTitle}
                onChange={(e) => setTabTitle(e.target.value)}
                placeholder="Enter the browser tab title"
              />
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <Label>Favicon</Label>
              <p className="text-sm text-muted-foreground">
                Choose either a file upload or enter a URL (not both)
              </p>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="favicon-file" className="text-sm font-medium">
                    Upload Favicon File
                  </Label>
                  <div className="mt-1">
                    <Input
                      id="favicon-file"
                      type="file"
                      accept="image/*"
                      onChange={handleFaviconFileChange}
                      className="cursor-pointer"
                    />
                  </div>
                  {faviconFile && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {faviconFile.name}
                    </p>
                  )}
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  OR
                </div>
                
                <div>
                  <Label htmlFor="favicon-url" className="text-sm font-medium">
                    Favicon URL
                  </Label>
                  <Input
                    id="favicon-url"
                    value={faviconUrl}
                    onChange={(e) => setFaviconUrl(e.target.value)}
                    placeholder="https://example.com/favicon.png"
                    disabled={!!faviconFile}
                  />
                </div>
              </div>
            </div>
            
            <Button onClick={handleUpdateBranding} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Update Branding
            </Button>
          </CardContent>
        </Card>

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

        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Login Notifications</Label>
                <p className="text-sm text-muted-foreground">Email alerts for admin logins</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>User Registration</Label>
                <p className="text-sm text-muted-foreground">Allow new user signups</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Course Import</Label>
                <p className="text-sm text-muted-foreground">Enable course data imports</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Social Features</Label>
                <p className="text-sm text-muted-foreground">Enable messaging and follows</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

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
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
};

export default AdminSettings;
