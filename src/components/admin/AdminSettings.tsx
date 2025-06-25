
import React, { useState, useEffect } from 'react';
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

  // Load saved settings on component mount
  useEffect(() => {
    console.log('Loading saved settings...');
    const savedTitle = localStorage.getItem('site_tab_title');
    const savedFaviconUrl = localStorage.getItem('site_favicon_url');
    
    console.log('Saved title:', savedTitle);
    console.log('Saved favicon URL:', savedFaviconUrl);
    
    if (savedTitle) {
      setTabTitle(savedTitle);
      document.title = savedTitle;
      updateTitleMeta(savedTitle);
    }
    
    if (savedFaviconUrl) {
      setFaviconUrl(savedFaviconUrl);
      updateFaviconInHead(savedFaviconUrl);
    }
  }, []);

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

  const updateTitleMeta = (title: string) => {
    console.log('Updating title meta to:', title);
    // Update the title meta tag in the head
    const titleElement = document.querySelector('title');
    if (titleElement) {
      titleElement.textContent = title;
    }
    
    // Also update meta title for SEO
    let metaTitleElement = document.querySelector('meta[property="og:title"]');
    if (!metaTitleElement) {
      metaTitleElement = document.createElement('meta');
      metaTitleElement.setAttribute('property', 'og:title');
      document.head.appendChild(metaTitleElement);
    }
    metaTitleElement.setAttribute('content', title);
  };

  const updateFaviconInHead = (url: string) => {
    console.log('Updating favicon to:', url);
    // Remove existing favicon links
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(link => link.remove());

    // Create new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = url;
    link.type = url.endsWith('.ico') ? 'image/x-icon' : 'image/png';
    document.head.appendChild(link);
    
    // Also add apple-touch-icon for mobile
    const appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.href = url;
    document.head.appendChild(appleLink);
  };

  const handleUpdateBranding = () => {
    console.log('Updating branding with:', { tabTitle, faviconUrl, faviconFile });
    
    // Save tab title to localStorage and update document
    if (tabTitle.trim()) {
      console.log('Saving tab title:', tabTitle);
      localStorage.setItem('site_tab_title', tabTitle);
      document.title = tabTitle;
      updateTitleMeta(tabTitle);
    }

    // Handle favicon update
    if (faviconFile) {
      // Create a URL for the uploaded file
      const fileUrl = URL.createObjectURL(faviconFile);
      console.log('Updating favicon with file URL:', fileUrl);
      updateFaviconInHead(fileUrl);
      
      // Save to localStorage for persistence
      localStorage.setItem('site_favicon_url', fileUrl);
      
      toast({
        title: "Success",
        description: "Favicon and tab title updated successfully! Note: File uploads require deployment to be permanent.",
      });
    } else if (faviconUrl.trim()) {
      console.log('Updating favicon with URL:', faviconUrl);
      updateFaviconInHead(faviconUrl);
      
      // Save to localStorage for persistence
      localStorage.setItem('site_favicon_url', faviconUrl);
      
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

    // Log current localStorage state
    console.log('Current localStorage state:', {
      title: localStorage.getItem('site_tab_title'),
      favicon: localStorage.getItem('site_favicon_url')
    });
  };

  const handleResetBranding = () => {
    console.log('Resetting branding to defaults');
    // Reset to defaults
    const defaultTitle = 'clbhouz - The Golfer\'s Social Hub';
    setTabTitle(defaultTitle);
    setFaviconUrl('');
    setFaviconFile(null);
    
    // Clear localStorage
    localStorage.removeItem('site_tab_title');
    localStorage.removeItem('site_favicon_url');
    
    // Reset document
    document.title = defaultTitle;
    updateTitleMeta(defaultTitle);
    
    // Reset favicon to default
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(link => link.remove());
    
    toast({
      title: "Reset Complete",
      description: "Branding has been reset to default values.",
    });
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
            
            <div className="flex gap-2">
              <Button onClick={handleUpdateBranding} className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                Update Branding
              </Button>
              <Button variant="outline" onClick={handleResetBranding}>
                Reset
              </Button>
            </div>
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
