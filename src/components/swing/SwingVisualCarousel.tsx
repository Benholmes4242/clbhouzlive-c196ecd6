import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Copy, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SwingVisual } from '@/types/swing';

interface SwingVisualCarouselProps {
  visuals: SwingVisual[];
  onExport?: () => void;
  isLoading?: boolean;
}

export const SwingVisualCarousel: React.FC<SwingVisualCarouselProps> = ({
  visuals,
  onExport,
  isLoading = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + visuals.length) % visuals.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % visuals.length);
  };

  const handleCopyImage = async (visual: SwingVisual) => {
    try {
      const response = await fetch(visual.url);
      const blob = await response.blob();
      
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        toast({
          title: "Image copied",
          description: "Visual copied to clipboard"
        });
      } else {
        // Fallback: copy URL
        await navigator.clipboard.writeText(visual.url);
        toast({
          title: "URL copied",
          description: "Image URL copied to clipboard"
        });
      }
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy image",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-muted/20 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Generating visuals...</p>
        </div>
      </div>
    );
  }

  if (visuals.length === 0) {
    return (
      <div className="w-full h-64 bg-muted/20 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No visuals available</p>
        </div>
      </div>
    );
  }

  const currentVisual = visuals[currentIndex];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Visual Pack</h3>
          <Badge variant="secondary">
            {currentIndex + 1} / {visuals.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export Pack
            </Button>
          )}
        </div>
      </div>

      {/* Image Display */}
      <div className="relative">
        <div className="aspect-[4/3] bg-black rounded-lg overflow-hidden">
          <img
            src={currentVisual.url}
            alt={currentVisual.label}
            className="w-full h-full object-contain"
          />
          
          {/* Navigation Arrows */}
          {visuals.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Label Overlay */}
          <div className="absolute top-2 left-2">
            <Badge className="bg-black/70 text-white">
              {currentVisual.label}
            </Badge>
          </div>
        </div>

        {/* Current Image Actions */}
        <div className="flex justify-center gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopyImage(currentVisual)}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {visuals.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {visuals.map((visual, index) => (
            <button
              key={visual.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-12 rounded border-2 overflow-hidden transition-colors ${
                index === currentIndex
                  ? 'border-primary'
                  : 'border-muted hover:border-muted-foreground'
              }`}
            >
              <img
                src={visual.url}
                alt={visual.label}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Notes */}
      {currentVisual.overlay.notes && (
        <div className="p-3 bg-muted/20 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {currentVisual.overlay.notes}
          </p>
        </div>
      )}
    </div>
  );
};