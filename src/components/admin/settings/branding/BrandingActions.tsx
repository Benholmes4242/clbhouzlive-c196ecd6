
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
        toast.error("Error", { description: "The selected file cannot be used as a favicon. Please choose a valid image file." });
        return;
      }
      
      updateFaviconInHead(fileUrl, true);
      
      // Don't save blob URLs to localStorage as they're temporary
      localStorage.removeItem('site_favicon_url');
      
      toast.warning("Warning", { description: "File uploads are temporary and will be lost when you refresh the page. Use a permanent URL for persistent favicons. The favicon should appear shortly." });
    } else if (faviconUrl.trim()) {
      console.log('Updating favicon with URL:', faviconUrl);
      
      // Verify the URL can be loaded as an image
      const isValid = await verifyFaviconLoaded(faviconUrl);
      if (!isValid) {
        toast.error("Error", { description: "The favicon URL cannot be loaded. Please check the URL and ensure it's a valid, publicly accessible image." });
        return;
      }
      
      updateFaviconInHead(faviconUrl, true);
      
      // Save to localStorage for persistence
      localStorage.setItem('site_favicon_url', faviconUrl);
      
      toast.success("Success", { description: "Favicon and tab title updated successfully! The favicon should appear within a few seconds. You may need to refresh the page or clear browser cache if it doesn't appear immediately." });
    } else {
      toast.success("Success", { description: "Tab title updated successfully!" });
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
