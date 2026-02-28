
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';
import { updateTitleMeta, updateFaviconInHead, verifyFaviconLoaded } from './branding/faviconUtils';
import TabTitleSection from './branding/TabTitleSection';
import FaviconSection from './branding/FaviconSection';
import BrandingActions from './branding/BrandingActions';
import TroubleshootingInfo from './branding/TroubleshootingInfo';

const SiteBrandingCard = () => {
  
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconUrl, setFaviconUrl] = useState('');
  const [tabTitle, setTabTitle] = useState('clbhouz | golf\'s digital community');

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
      
      // Verify the saved favicon URL is still valid before applying
      verifyFaviconLoaded(savedFaviconUrl).then(isValid => {
        if (isValid) {
          updateFaviconInHead(savedFaviconUrl, true);
          console.log('Applied saved favicon:', savedFaviconUrl);
        } else {
          console.log('Saved favicon URL is no longer valid, removing from storage');
          localStorage.removeItem('site_favicon_url');
          setFaviconUrl('');
        }
      });
    } else if (savedFaviconUrl && savedFaviconUrl.startsWith('blob:')) {
      // Clear invalid blob URLs from localStorage
      localStorage.removeItem('site_favicon_url');
      console.log('Removed invalid blob URL from localStorage');
    }
  }, []);

  const handleFaviconFileChange = (file: File | null) => {
    setFaviconFile(file);
    if (file) {
      setFaviconUrl(''); // Clear URL if file is selected
    }
  };

  const handleResetBranding = () => {
    console.log('Resetting branding to defaults');
    // Reset to defaults
    const defaultTitle = 'clbhouz | golf\'s digital community';
    const defaultFavicon = 'https://iiil.io/FRnqBFp.png';
    
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
    
    toast.success("Reset Complete", { description: "Branding has been reset to default values. The favicon should update shortly." });
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
        <TabTitleSection 
          tabTitle={tabTitle}
          onTabTitleChange={setTabTitle}
        />
        
        <Separator />
        
        <FaviconSection
          faviconFile={faviconFile}
          faviconUrl={faviconUrl}
          onFaviconFileChange={handleFaviconFileChange}
          onFaviconUrlChange={setFaviconUrl}
        />
        
        <BrandingActions
          tabTitle={tabTitle}
          faviconFile={faviconFile}
          faviconUrl={faviconUrl}
          onReset={handleResetBranding}
        />
        
        <TroubleshootingInfo />
      </CardContent>
    </Card>
  );
};

export default SiteBrandingCard;
