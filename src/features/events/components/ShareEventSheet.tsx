import React, { useState } from 'react';
import { X, Link2, Copy, Check, Share2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  event: { id: string; name: string; share_code?: string | null };
}

export function ShareEventSheet({ open, onClose, event }: Props) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/events/join/${event.share_code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: `Join me for ${event.name}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed silently
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle>Share Event</SheetTitle>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <p className="text-sm text-muted-foreground">
            Share this link to invite players to {event.name}
          </p>

          <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
            <Link2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <span className="flex-1 text-sm truncate">{shareUrl}</span>
            <button onClick={handleCopy} className="p-2 hover:bg-background rounded-lg transition-colors">
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleCopy} variant="outline" className="flex-1">
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            {typeof navigator !== 'undefined' && navigator.share && (
              <Button onClick={handleNativeShare} className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
