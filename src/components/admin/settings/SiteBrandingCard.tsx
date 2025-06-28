
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
  const [tabTitle, setTabTitle] = useState('clbhouz | golf\'s digital clubhouse');

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

  const updateFaviconInHead = (url: string, addCacheBuster = false) => {
    console.log('Updating favicon to:', url);
    
    // Add cache busting parameter to force refresh
    const finalUrl = addCacheBuster ? `${url}?v=${Date.now()}` : url;
    
    // Remove existing favicon links
    const existingFavicons = document.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"]');
    existingFavicons.forEach(link => link.remove());

    // Create multiple favicon formats for better compatibility
    const faviconFormats = [
      { rel: 'icon', type: 'image/x-icon', sizes: undefined },
      { rel: 'icon', type: 'image/png', sizes: '32x32' },
      { rel: 'icon', type: 'image/png', sizes: '16x16' },
      { rel: 'apple-touch-icon', type: 'image/png', sizes: '180x180' },
      { rel: 'shortcut icon', type: 'image/x-icon', sizes: undefined }
    ];

    faviconFormats.forEach(format => {
      const link = document.createElement('link');
      link.rel = format.rel;
      link.href = finalUrl;
      if (format.type) link.type = format.type;
      if (format.sizes) link.setAttribute('sizes', format.sizes);
      document.head.appendChild(link);
    });

    // Force browser to refresh favicon by temporarily adding and removing a link
    const tempLink = document.createElement('link');
    tempLink.rel = 'icon';
    tempLink.href = 'data:,';
    document.head.appendChild(tempLink);
    setTimeout(() => {
      document.head.removeChild(tempLink);
    }, 100);
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
      updateFaviconInHead(fileUrl, true);
      
      // Don't save blob URLs to localStorage as they're temporary
      localStorage.removeItem('site_favicon_url');
      
      toast({
        title: "Warning",
        description: "File uploads are temporary and will be lost when you refresh the page. Use a permanent URL for persistent favicons.",
        variant: "destructive",
      });
    } else if (faviconUrl.trim()) {
      console.log('Updating favicon with URL:', faviconUrl);
      updateFaviconInHead(faviconUrl, true);
      
      // Save to localStorage for persistence
      localStorage.setItem('site_favicon_url', faviconUrl);
      
      toast({
        title: "Success",
        description: "Favicon and tab title updated successfully! The favicon may take a few minutes to update across all browsers due to caching.",
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
    const defaultTitle = 'clbhouz | golf\'s digital clubhouse';
    const defaultFavicon = 'https://www.clbhouz.co.uk/images/favicon.ico';
    
    setTabTitle(defaultTitle);
    setFaviconUrl(defaultFavicon);
    setFaviconFile(null);
    
    // Clear localStorage
    localStorage.removeItem('site_tab_title');
    localStorage.removeItem('site_favicon_url');
    
    // Reset document
    document.title = defaultTitle;
    updateTitleMeta(defaultTitle);
    
    // Reset favicon to default with cache busting
    updateFaviconInHead(defaultFavicon, true);
    
    // Clear file input
    const fileInput = document.getElementById('favicon-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    toast({
      title: "Reset Complete",
      description: "Branding has been reset to default values with cache refresh.",
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
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <strong>For clbhouz.co.uk domain:</strong> Upload your favicon file to your hosting provider and use the full URL 
                (e.g., https://www.clbhouz.co.uk/images/your-favicon.png) for it to show properly on your live site.
              </div>
            </div>
          </div>
          
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
                placeholder="https://www.clbhouz.co.uk/images/favicon.png"
                disabled={!!faviconFile}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use a permanent URL for persistent favicons (recommended for live sites)
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
            Reset to Default
          </Button>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-sm text-gray-700">
            <strong>Troubleshooting Tips:</strong>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Clear your browser cache and hard refresh (Ctrl+F5)</li>
              <li>Try opening your site in an incognito/private window</li>
              <li>Favicons can take 5-10 minutes to update due to browser caching</li>
              <li>Ensure your favicon URL is publicly accessible</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SiteBrandingCard;
