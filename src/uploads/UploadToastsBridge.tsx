// Upload toasts bridge - shows toast notifications for upload events

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { uploadEventBus } from './uploadEventBus';

export function UploadToastsBridge() {
  const { toast } = useToast();

  useEffect(() => {
    const offEnqueued = uploadEventBus.on('upload:enqueued', (evt) => {
      toast({
        title: "Uploading...",
        description: "Your post will appear soon.",
      });
    });

    const offComplete = uploadEventBus.on('upload:complete', (evt) => {
      toast({
        title: "Posted ✓",
        description: "Now live on clbhouz",
      });
    });

    const offFailed = uploadEventBus.on('upload:failed', (evt) => {
      toast({
        title: "Upload failed",
        description: evt.error || "Tap to retry",
        variant: "destructive",
      });
    });

    return () => {
      offEnqueued();
      offComplete();
      offFailed();
    };
  }, [toast]);

  return null;
}
