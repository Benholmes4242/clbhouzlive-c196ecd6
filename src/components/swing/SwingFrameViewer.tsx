import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
}

export const SwingFrameViewer: React.FC<SwingFrameViewerProps> = ({
  frames = [],
  activeFrameIndex,
  className = ""
}) => {
  const activeFrame = frames.find(f => f.index === activeFrameIndex);
  
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

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Swing Frame Analysis</h3>
          {displayFrame && (
            <Badge variant="outline" className="text-xs">
              Frame {displayFrame.index} • {displayFrame.t.toFixed(2)}s
            </Badge>
          )}
        </div>
        
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {displayFrame ? (
            <img
              src={displayFrame.url}
              alt={`Swing frame ${displayFrame.index}`}
              className="w-full h-full object-cover"
              style={{ aspectRatio: `${displayFrame.width}/${displayFrame.height}` }}
            />
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
            {frames.map((frame) => (
              <div
                key={frame.index}
                className={`flex-shrink-0 w-12 h-8 rounded border-2 overflow-hidden cursor-pointer transition-colors ${
                  frame.index === activeFrameIndex 
                    ? 'border-primary' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <img
                  src={frame.url}
                  alt={`Frame ${frame.index}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};