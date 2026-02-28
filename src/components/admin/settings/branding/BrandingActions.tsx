
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { updateTitleMeta, updateFaviconInHead, verifyFaviconLoaded } from './faviconUtils';

interface BrandingActionsProps {
  tabTitle: string;
  faviconFile: File | null;
  faviconUrl: string;
  onReset: () => void;
}

const BrandingActions = ({ tabTitle, faviconFile, faviconUrl, onReset }: BrandingActionsProps) => {
  

  const handleUpdateBranding = async () => {
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
      
      // Verify the file can be loaded as an image
      const isValid = await verifyFaviconLoaded(fileUrl);
      if (!isValid) {
        toast.error("Invalid favicon file");
        return;
      }
      
      updateFaviconInHead(fileUrl, true);
      
      // Don't save blob URLs to localStorage as they're temporary
      localStorage.removeItem('site_favicon_url');
      
      toast.warning("Temporary upload", { description: "Use a permanent URL for persistent favicons" });
    } else if (faviconUrl.trim()) {
      console.log('Updating favicon with URL:', faviconUrl);
      
      // Verify the URL can be loaded as an image
      const isValid = await verifyFaviconLoaded(faviconUrl);
      if (!isValid) {
        toast.error("Couldn't load favicon URL");
        return;
      }
      
      updateFaviconInHead(faviconUrl, true);
      
      // Save to localStorage for persistence
      localStorage.setItem('site_favicon_url', faviconUrl);
      
      toast.success("Branding updated");
    } else {
      toast.success("Title updated");
    }

    // Log current localStorage state
    console.log('Current localStorage state:', {
      title: localStorage.getItem('site_tab_title'),
      favicon: localStorage.getItem('site_favicon_url')
    });
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleUpdateBranding} className="flex-1">
        <Upload className="h-4 w-4 mr-2" />
        Update Branding
      </Button>
      <Button variant="outline" onClick={onReset}>
        Reset to Default
      </Button>
    </div>
  );
};

export default BrandingActions;
