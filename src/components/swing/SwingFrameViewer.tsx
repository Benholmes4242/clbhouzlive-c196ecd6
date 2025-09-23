import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isPlaceholderUrl } from '@/utils/videoFrameExtraction';

interface SwingFrameViewerProps {
  frames?: Array<{
    index: number;
    t: number;
    url: string;
    width: number;
    height: number;
    hash: string;
  }>;
  activeFrameIndex?: number;
  className?: string;
  onFrameClick?: (frameIndex: number) => void;
  sseConnected?: boolean;
}

export const SwingFrameViewer: React.FC<SwingFrameViewerProps> = ({
  frames = [],
  activeFrameIndex,
  className = "",
  onFrameClick,
  sseConnected = true
}) => {
  const [imageError, setImageError] = useState<string | null>(null);
  const [localActiveIndex, setLocalActiveIndex] = useState(activeFrameIndex || 1);
  
  // Auto-advance frames locally if SSE is disconnected and we have frames
  useEffect(() => {
    if (!sseConnected && frames.length > 1) {
      const interval = setInterval(() => {
        setLocalActiveIndex(prev => {
          const nextIndex = prev >= frames.length ? 1 : prev + 1;
          if (onFrameClick) onFrameClick(nextIndex);
          return nextIndex;
        });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [sseConnected, frames.length, onFrameClick]);

  // Use external activeFrameIndex when SSE is connected, local when disconnected
  const currentActiveIndex = sseConnected ? (activeFrameIndex || 1) : localActiveIndex;
  const activeFrame = frames.find(f => f.index === currentActiveIndex);
  
  if (!activeFrame && frames.length === 0) {
    return (
      <Card className={`p-8 bg-muted/50 ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
            🎥
          </div>
          <p className="text-sm">Frame viewer will appear here during analysis</p>
        </div>
      </Card>
    );
  }

  const displayFrame = activeFrame || frames[0];
  const shouldShowImage = displayFrame && !isPlaceholderUrl(displayFrame.url) && !imageError;

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Swing Frame Analysis</h3>
          {displayFrame && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Frame {displayFrame.index} • {displayFrame.t.toFixed(2)}s
              </Badge>
              {!sseConnected && (
                <Badge variant="secondary" className="text-xs">
                  Local Preview
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {shouldShowImage ? (
            <img
              src={displayFrame.url}
              alt={`Swing frame ${displayFrame.index}`}
              className="w-full h-full object-cover"
              style={{ aspectRatio: `${displayFrame.width}/${displayFrame.height}` }}
              onError={() => setImageError(`Failed to load frame ${displayFrame.index}`)}
            />
          ) : displayFrame ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-muted-foreground/20 rounded-full flex items-center justify-center">
                  📷
                </div>
                <p className="text-sm">Frame {displayFrame.index}</p>
                <p className="text-xs opacity-60">
                  {isPlaceholderUrl(displayFrame.url) ? 'Extracting...' : imageError || 'Loading...'}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-muted-foreground/20 rounded-full flex items-center justify-center">
                  📹
                </div>
                <p className="text-sm">Loading frames...</p>
              </div>
            </div>
          )}
        </div>
        
        {frames.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {frames.map((frame) => {
              const isFramePlaceholder = isPlaceholderUrl(frame.url);
              return (
                <div
                  key={frame.index}
                  className={`flex-shrink-0 w-12 h-8 rounded border-2 overflow-hidden cursor-pointer transition-colors ${
                    frame.index === currentActiveIndex 
                      ? 'border-primary' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setLocalActiveIndex(frame.index);
                    if (onFrameClick) onFrameClick(frame.index);
                  }}
                >
                  {!isFramePlaceholder ? (
                    <img
                      src={frame.url}
                      alt={`Frame ${frame.index}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide broken thumbnail
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">{frame.index}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};