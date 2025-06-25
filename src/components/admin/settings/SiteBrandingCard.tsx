
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Upload, Globe, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SiteBrandingCard = () => {
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
    
    // Only apply favicon if it's a valid URL (not a blob URL)
    if (savedFaviconUrl && !savedFaviconUrl.startsWith('blob:')) {
      setFaviconUrl(savedFaviconUrl);
      updateFaviconInHead(savedFaviconUrl);
    } else if (savedFaviconUrl && savedFaviconUrl.startsWith('blob:')) {
      // Clear invalid blob URLs from localStorage
      localStorage.removeItem('site_favicon_url');
      console.log('Removed invalid blob URL from localStorage');
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
      // Create a URL for the uploaded file (temporary)
      const fileUrl = URL.createObjectURL(faviconFile);
      console.log('Updating favicon with file URL:', fileUrl);
      updateFaviconInHead(fileUrl);
      
      // Don't save blob URLs to localStorage as they're temporary
      localStorage.removeItem('site_favicon_url');
      
      toast({
        title: "Warning",
        description: "File uploads are temporary and will be lost when you refresh the page. Use a permanent URL for persistent favicons.",
        variant: "destructive",
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
    
    // Clear file input
    const fileInput = document.getElementById('favicon-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    toast({
      title: "Reset Complete",
      description: "Branding has been reset to default values.",
    });
  };

  return (
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
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <strong>Important:</strong> File uploads are temporary and will be lost when you refresh the page. 
                For persistent favicons, use a permanent URL instead.
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="favicon-file" className="text-sm font-medium">
                Upload Favicon File (Temporary)
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
                <p className="text-xs text-orange-600 mt-1">
                  Selected: {faviconFile.name} (will be lost on page refresh)
                </p>
              )}
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              OR
            </div>
            
            <div>
              <Label htmlFor="favicon-url" className="text-sm font-medium">
                Favicon URL (Persistent)
              </Label>
              <Input
                id="favicon-url"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="https://example.com/favicon.png"
                disabled={!!faviconFile}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use a permanent URL for persistent favicons
              </p>
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
  );
};

export default SiteBrandingCard;
