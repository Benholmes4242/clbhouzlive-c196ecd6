import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Play, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AiFeedbackBlock } from './AiFeedbackBlock';
import { SwingVisualCarousel } from './SwingVisualCarousel';
import { CoachThread } from './CoachThread';
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { HLSVideoPlayer } from '@/components/ai-chat/AIChatHistory';
import { MarkdownMessage } from '@/components/ai-chat/MarkdownMessage';

interface SwingAnalysis {
  id: string;
  save_card: string;
  tags: string[];
  category: string;
  content: string;
  videoThumbnail?: string;
  videoId?: string;
  videoUrl?: string;
  timestamp: Date;
}

interface HistorySwingCardProps {
  analysis: SwingAnalysis;
  onOpenCoachPicker: (analysisId: string) => void;
  onDelete?: (analysisId: string) => void;
}

export const HistorySwingCard: React.FC<HistorySwingCardProps> = ({
  analysis,
  onOpenCoachPicker,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract highlights from content (first 2 key points)
  const highlights = analysis.content
    .split('\n')
    .filter(line => line.trim() && (line.includes('•') || line.includes('-') || line.includes('1.') || line.includes('2.')))
    .slice(0, 2)
    .map(line => line.replace(/^[•\-\d.]\s*/, '').trim());

  const getThumbnailUrl = () => {
    if (analysis.videoThumbnail) return analysis.videoThumbnail;
    if (analysis.videoId) return generateStreamThumbnailUrl(analysis.videoId);
    return '';
  };

  const getRelativeDate = () => {
    const now = new Date();
    const diffMs = now.getTime() - analysis.timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return analysis.timestamp.toLocaleDateString();
  };

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {/* Collapsed Header */}
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Video Thumbnail */}
            <div className="relative w-24 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              {getThumbnailUrl() ? (
                <img
                  src={getThumbnailUrl()}
                  alt="Swing thumbnail"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              
              {/* Visuals badge */}
              <div className="absolute top-1 right-1">
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  Visuals ✓
                </Badge>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">
                      Swing analysis – {getRelativeDate()}
                    </h3>
                  </div>
                  
                  {/* Highlights */}
                  {highlights.length > 0 && (
                    <div className="space-y-1">
                      {highlights.map((highlight, index) => (
                        <p key={index} className="text-sm text-muted-foreground truncate">
                          • {highlight}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {analysis.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {analysis.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{analysis.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Expand Toggle */}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-2">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <CollapsibleContent>
          <div className="border-t">
            <div className="p-4 space-y-6">
              {/* Video Player Row */}
              {(analysis.videoUrl || analysis.videoId) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Video</h4>
                  <div className="overflow-hidden rounded-xl ring-1 ring-black/10 bg-black/5">
                    <HLSVideoPlayer
                      src={analysis.videoUrl!}
                      poster={getThumbnailUrl() || undefined}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              {/* AI Feedback */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">AI Analysis</h4>
                <AiFeedbackBlock 
                  analysis={analysis} 
                  defaultCollapsed={false}
                />
              </div>

              {/* Visual Pack */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Visual Pack</h4>
                <SwingVisualCarousel 
                  analysisId={analysis.id}
                  lazy={true}
                />
              </div>

              {/* Coach Review Thread */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Coach Review</h4>
                <CoachThread
                  analysisId={analysis.id}
                  onOpenCoachPicker={() => onOpenCoachPicker(analysis.id)}
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download Pack
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(analysis.id)}
                      className="text-muted-foreground hover:text-destructive gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                  
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm">
                      Close
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};