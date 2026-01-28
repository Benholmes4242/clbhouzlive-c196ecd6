import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Globe, Copy, ExternalLink, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface ExternalLinkSheetProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

export const ExternalLinkSheet: React.FC<ExternalLinkSheetProps> = ({
  isOpen,
  onClose,
  url,
  title = 'Official Website',
}) => {
  const [copied, setCopied] = useState(false);

  // Format URL for display (remove protocol, truncate if needed)
  const displayUrl = url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .slice(0, 40) + (url.length > 50 ? '...' : '');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleOpenWebsite = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-3xl bg-background border-t border-border px-0 pb-8"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="px-6 pt-4 space-y-6">
          {/* Header with Icon and URL */}
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20"
            >
              <Globe className="w-7 h-7 text-white" />
            </motion.div>
            
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="text-lg font-semibold text-foreground">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {displayUrl}
              </p>
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-muted/50 rounded-2xl p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              You're about to leave Clbhouz and visit an external website. 
              Use your browser's back button or close the tab to return to the app.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="flex-1 h-12 rounded-xl"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
            
            <Button
              onClick={handleOpenWebsite}
              className="flex-1 h-12 rounded-xl"
            >
              Open Website
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Safety Note */}
          <p className="text-xs text-center text-muted-foreground">
            External websites are not controlled by Clbhouz
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExternalLinkSheet;
