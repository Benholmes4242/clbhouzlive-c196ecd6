import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SwingVisual {
  id: string;
  analysis_id: string;
  frame_index: number;
  label: string;
  overlay: {
    caption: string;
    frameHint?: string;
    overlays?: {
      lines?: Array<{ x1: number; y1: number; x2: number; y2: number; label: string }>;
      angles?: Array<{ cx: number; cy: number; a: number; b: number; label: string }>;
      keypoints?: Array<{ x: number; y: number; label: string; conf: number }>;
    };
  };
  url: string;
  width: number;
  height: number;
  created_at: string;
}

interface VisualCarouselProps {
  analysisId: string;
  className?: string;
}

export const VisualCarousel: React.FC<VisualCarouselProps> = ({ 
  analysisId, 
  className = "" 
}) => {
  const [visuals, setVisuals] = useState<SwingVisual[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadVisuals();
  }, [analysisId]);

  const loadVisuals = async () => {
    if (!analysisId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // First, try to get existing visuals
      const response = await fetch(
        `https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/swing-visuals?analysisId=${analysisId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch visuals: ${response.statusText}`);
      }

      const existingVisuals = await response.json();

      if (existingVisuals.length === 0) {
        // No visuals exist, generate them
        await generateVisuals();
      } else {
        setVisuals(existingVisuals);
      }
    } catch (err) {
      console.error('Error loading visuals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load visuals');
    } finally {
      setIsLoading(false);
    }
  };

  const generateVisuals = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/swing-visuals',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ analysisId }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to generate visuals: ${response.statusText}`);
      }

      const generatedVisuals = await response.json();
      setVisuals(generatedVisuals);

      toast({
        title: "Visual Pack Generated",
        description: `Created ${generatedVisuals.length} annotated swing images`,
      });
    } catch (err) {
      console.error('Error generating visuals:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate visuals');
      toast({
        title: "Generation Failed",
        description: "Could not generate visual pack. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyImageUrl = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "URL Copied",
        description: `${label} image URL copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy URL to clipboard",
        variant: "destructive"
      });
    }
  };

  const downloadPack = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/swing-visuals-export?analysisId=${analysisId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `swing-analysis-${analysisId.slice(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Pack Downloaded",
        description: "Visual pack ZIP file has been downloaded",
      });
    } catch (err) {
      console.error('Error downloading pack:', err);
      toast({
        title: "Download Failed",
        description: "Could not download visual pack",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Visual Pack</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-video bg-muted rounded-lg animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium">Visual Pack</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={loadVisuals} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (visuals.length === 0 && !isGenerating) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium">Visual Pack</h3>
          <p className="text-sm text-muted-foreground">
            Generate annotated swing images with overlays
          </p>
          <Button onClick={generateVisuals} size="sm">
            Generate Visual Pack
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Visual Pack</h3>
          {visuals.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={downloadPack} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Download Pack
              </Button>
            </div>
          )}
        </div>

        {isGenerating && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Generating visual pack...</p>
          </div>
        )}

        {visuals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visuals.map((visual) => (
              <div key={visual.id} className="space-y-2">
                <div className="relative group">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={visual.url}
                      alt={visual.label}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiNmMWYxZjEiLz48dGV4dCB4PSIxNjAiIHk9IjkwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdlbmVyYXRpbmcuLi48L3RleHQ+PC9zdmc+';
                      }}
                    />
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => copyImageUrl(visual.url, visual.label)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {visual.overlay?.frameHint || `F${visual.frame_index}`}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-sm capitalize">{visual.label}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {visual.overlay?.caption || 'Swing analysis visual'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};