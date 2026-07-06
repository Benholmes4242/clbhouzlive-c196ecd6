import { useState, useEffect, useRef } from 'react';
import { Loader2, X, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { usePinchZoomPointer } from '@/hooks/usePinchZoomPointer';
import { VideoEngine } from '@/video/VideoEngine';

interface MediaMessageProps {
  type: 'image' | 'video';
  url: string;
  className?: string;
}

/**
 * Shared fullscreen presenter for message media.
 * - image: pinch-zoom <img>
 * - video: native <video controls autoPlay> (pauses engine lanes on open)
 */
export function MediaPresenterDialog({
  open,
  onOpenChange,
  type,
  url,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  type: 'image' | 'video';
  url: string;
}) {
  const { ref: zoomRef, imgRef, style: zoomStyle, reset: resetZoom } = usePinchZoomPointer();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!open) {
      resetZoom();
      const el = videoRef.current;
      if (el) {
        try {
          el.pause();
          el.removeAttribute('src');
          el.load();
        } catch {
          /* iOS decoder release */
        }
      }
      return;
    }
    if (type === 'video') {
      // Ensure only one thing plays at a time — stop any engine-lane playback.
      try { VideoEngine.pauseAll(); } catch { /* noop */ }
    }
  }, [open, type, resetZoom]);

  const closeTop = 'calc(env(safe-area-inset-top, 0px) + 8px)';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[90vw] max-h-[90vh] p-0 border-none bg-transparent"
        aria-describedby={undefined}
      >
        <VisuallyHidden.Root><DialogTitle>Media Preview</DialogTitle></VisuallyHidden.Root>
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-2 z-10 p-2 rounded-full bg-foreground/50 text-background hover:bg-foreground/70"
          style={{ top: closeTop }}
        >
          <X className="h-5 w-5" />
        </button>
        {type === 'image' ? (
          <div ref={zoomRef} style={zoomStyle}>
            <img
              ref={imgRef}
              src={url}
              alt="Full size attachment"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              draggable={false}
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={url}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="rounded-lg"
            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', background: '#000' }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export function MediaMessage({ type, url, className }: MediaMessageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

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
        <MediaPresenterDialog open={fullscreen} onOpenChange={setFullscreen} type="image" url={url} />
      </>
    );
  }

  // Video — render a first-frame poster (no inline playback). Tap opens Dialog.
  return (
    <>
      <button
        type="button"
        onClick={() => setFullscreen(true)}
        className={cn("relative block p-0 border-0 bg-transparent cursor-pointer", className)}
        aria-label="Play video"
      >
        <div
          className="relative rounded-lg overflow-hidden bg-muted"
          style={{ aspectRatio: '16 / 9', width: 280 }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <video
            src={`${url}#t=0.001`}
            preload="metadata"
            muted
            playsInline
            aria-hidden
            className={cn("w-full h-full object-cover", loading && "opacity-0")}
            onLoadedData={() => setLoading(false)}
            onError={() => setError(true)}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 56, height: 56, background: 'rgba(0,0,0,0.55)' }}
            >
              <Play className="h-6 w-6 text-white" fill="currentColor" />
            </div>
          </div>
        </div>
      </button>
      <MediaPresenterDialog open={fullscreen} onOpenChange={setFullscreen} type="video" url={url} />
    </>
  );
}
