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
import ChatMessageComponent from '@/components/ai-chat/ChatMessage';

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

  // Create a message object for ChatMessage component
  const messageObj = {
    id: analysis.id,
    type: 'ai' as const,
    content: analysis.content,
    timestamp: analysis.timestamp,
    metadata: {
      save_card: analysis.save_card,
      tags: analysis.tags,
      category: analysis.category
    }
  };

  return (
    <ChatMessageComponent
      message={messageObj}
      showActions={false}
      isUser={false}
      mediaTop={
        !isExpanded && getThumbnailUrl() ? (
          <div className="w-full aspect-video overflow-hidden">
            <img
              src={getThumbnailUrl()}
              alt="Swing thumbnail"
              className="block w-full h-auto object-cover"
            />
          </div>
        ) : null
      }
    >
      {!isExpanded ? (
        <div className="space-y-3">
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

          {/* Tags and Date */}
          <div className="flex items-center justify-between gap-2">
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
            <span className="text-xs text-muted-foreground shrink-0">{getRelativeDate()}</span>
          </div>

          {/* Expand Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsExpanded(true)}
            className="w-full rounded-full border border-black/10 bg-white hover:bg-white/90"
          >
            View Full Analysis
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent>
            <div className="space-y-6 pt-4">
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
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                  >
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </ChatMessageComponent>
  );
};