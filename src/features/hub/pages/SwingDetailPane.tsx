/**
 * Swing Detail Pane
 * Full-page swing analysis view inside Hub
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEchoDeepLink } from '@/features/echo/hooks/useEchoDeepLink';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check, Loader2 } from 'lucide-react';
import { echoLinks } from '@/features/echo/utils/echoLinks';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { HLSVideoPlayer } from '@/components/ai-chat/AIChatHistory';
import { analyticsEvents } from '@/utils/analyticsEvents';

export function SwingDetailPane() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [seekTime, setSeekTime] = React.useState<number | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEchoDeepLink({
    onSeek: (time) => {
      setSeekTime(time);
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
  });

  // Load swing analysis
  React.useEffect(() => {
    const loadAnalysis = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('pro_ai_analyses')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        if (data) {
          const analysisResults = data.analysis_results as any;
          setAnalysis({
            id: data.id,
            title: analysisResults?.metadata?.save_card || 'Swing Analysis',
            content: analysisResults?.aiResponse || '',
            videoUrl: data.video_url || null,
            timestamp: new Date(data.created_at),
          });
          analyticsEvents.track('hub_echo_swing_view', { category: 'hub', label: data.id });
        }
      } catch (error) {
        console.error('Error loading swing analysis:', error);
        toast.error('Failed to load swing analysis');
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [id]);

  const copyLink = (commentId?: string) => {
    const link = `${window.location.origin}${echoLinks.swing(id!, { 
      t: seekTime || undefined, 
      commentId 
    })}`;
    navigator.clipboard.writeText(link);
    setCopiedId(commentId || 'main');
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground bg-transparent">
        <p>Swing analysis not found</p>
        <Button 
          variant="outline" 
          onClick={() => navigate('/hub/echo/history')}
        >
          Back to History
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-5 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/hub/echo/history')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{analysis.title}</div>
          <div className="text-xs text-muted-foreground">
            {analysis.timestamp.toLocaleDateString()}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyLink()}
        >
          {copiedId === 'main' ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 md:px-5 py-4 space-y-4 max-w-3xl mx-auto">
          {/* Video */}
          {analysis.videoUrl && (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-border">
              <HLSVideoPlayer
                src={analysis.videoUrl}
                className="w-full h-full"
              />
            </div>
          )}

          {/* Analysis Content */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm whitespace-pre-wrap">
              {analysis.content ?? 'No analysis content available'}
            </div>
          </div>

          {seekTime !== null && (
            <div className="text-xs text-muted-foreground text-center">
              Video seeking to {seekTime}s
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
