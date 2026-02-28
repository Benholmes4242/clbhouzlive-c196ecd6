
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface FaviconSectionProps {
  faviconFile: File | null;
  faviconUrl: string;
  onFaviconFileChange: (file: File | null) => void;
  onFaviconUrlChange: (url: string) => void;
}

const FaviconSection = ({ 
  faviconFile, 
  faviconUrl, 
  onFaviconFileChange, 
  onFaviconUrlChange 
}: FaviconSectionProps) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file (PNG, JPG, etc.)");
        return;
      }
      onFaviconFileChange(file);
    }
  };

  return (
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
          <Label htmlFor="favicon-file" className="text-body-sm font-medium">
            Upload Favicon File (Temporary)
          </Label>
          <div className="mt-1">
            <Input
              id="favicon-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
          {faviconFile && (
            <p className="text-meta text-slate-600 mt-1">
              Selected: {faviconFile.name} (will be lost on page refresh)
            </p>
          )}
        </div>
        
        <div className="text-center text-body-md text-muted-foreground">
          OR
        </div>
        
        <div>
          <Label htmlFor="favicon-url" className="text-body-sm font-medium">
            Favicon URL (Persistent)
          </Label>
          <Input
            id="favicon-url"
            value={faviconUrl}
            onChange={(e) => onFaviconUrlChange(e.target.value)}
            placeholder="https://www.clbhouz.co.uk/images/favicon.png"
            disabled={!!faviconFile}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use a permanent URL for persistent favicons (recommended for live sites)
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaviconSection;
