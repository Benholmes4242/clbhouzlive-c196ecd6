import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Globe, Copy, ExternalLink, Check } from 'lucide-react';
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
        {/* Grabber Handle - At very top */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="w-9 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        <div className="px-6 space-y-5">
          {/* Header with Icon and URL */}
          <div className="flex items-start gap-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0"
            >
              <Globe className="w-6 h-6 text-muted-foreground" />
            </motion.div>
            
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-base font-semibold text-foreground leading-tight">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {displayUrl}
              </p>
            </div>
          </div>

          {/* Info Message - Plain text, centered */}
          <p className="text-sm text-muted-foreground leading-relaxed text-center">
            You're about to leave clbhouz and visit an external website.
          </p>

          {/* Action Buttons - Stacked layout */}
          <div className="space-y-3 pt-1">
            <Button
              onClick={handleOpenWebsite}
              className="w-full h-12 rounded-xl font-medium"
            >
              Open Website
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleCopyLink}
              className="w-full h-12 text-muted-foreground hover:text-foreground"
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
          </div>

          {/* Safety Note */}
          <p className="text-xs text-center text-muted-foreground/70 pt-1">
            External sites not controlled by Clbhouz
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExternalLinkSheet;
