/**
 * VideoDownloadWarning - Warning shown when downloading/sharing videos with edits
 * 
 * Alerts users that their edits won't appear in the downloaded/shared video file.
 * Only shown for videos that have studio edits applied.
 */

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface VideoDownloadWarningProps {
  className?: string;
}

export function VideoDownloadWarning({ className }: VideoDownloadWarningProps) {
  return (
    <Alert 
      className={cn(
        'border-amber-500/30 bg-amber-500/10',
        className
      )}
    >
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertDescription className="text-sm text-muted-foreground">
        Filters and text edits won't appear in the downloaded video.
      </AlertDescription>
    </Alert>
  );
}

export default VideoDownloadWarning;
