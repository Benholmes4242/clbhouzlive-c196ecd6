import { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { usePinchZoomPointer } from '@/hooks/usePinchZoomPointer';

interface MediaMessageProps {
  type: 'image' | 'video';
  url: string;
  className?: string;
}

export function MediaMessage({ type, url, className }: MediaMessageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const { ref: zoomRef, imgRef, style: zoomStyle, reset: resetZoom } = usePinchZoomPointer();

  // Reset zoom when closing
  useEffect(() => {
    if (!fullscreen) resetZoom();
  }, [fullscreen, resetZoom]);

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center w-48 h-32 bg-muted rounded-lg",
        className
      )}>
        <span className="text-xs text-muted-foreground">Failed to load media</span>
      </div>
    );
  }

  if (type === 'image') {
    return (
      <>
        <div 
          className={cn("relative cursor-pointer", className)}
          onClick={() => setFullscreen(true)}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <img
            src={url}
            alt="Message attachment"
            className={cn(
              "max-w-[240px] max-h-[240px] rounded-lg object-cover",
              loading && "opacity-0"
            )}
            onLoad={() => setLoading(false)}
            onError={() => setError(true)}
          />
        </div>

        <Dialog open={fullscreen} onOpenChange={setFullscreen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-none bg-transparent" aria-describedby={undefined}>
            <VisuallyHidden.Root><DialogTitle>Media Preview</DialogTitle></VisuallyHidden.Root>
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-foreground/50 text-background hover:bg-foreground/70"
            >
              <X className="h-5 w-5" />
            </button>
            <div ref={zoomRef} style={zoomStyle}>
              <img
                ref={imgRef}
                src={url}
                alt="Full size attachment"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                draggable={false}
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Video
  return (
    <div className={cn("relative", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <video
        src={url}
        controls
        className="max-w-[280px] max-h-[200px] rounded-lg"
        onLoadedData={() => setLoading(false)}
        onError={() => setError(true)}
        playsInline
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
