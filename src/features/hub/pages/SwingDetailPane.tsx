/**
 * Swing Detail Pane
 * Full-page swing analysis view inside Hub
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEchoDeepLink } from '@/features/echo/hooks/useEchoDeepLink';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Copy, Check, Video } from 'lucide-react';
import { echoLinks } from '@/features/echo/utils/echoLinks';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { HLSVideoPlayer } from '@/components/ai-chat/AIChatHistory';

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
            videoUrl: data.video_url,
            timestamp: new Date(data.created_at),
          });
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
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-black via-[#0A0A0A] to-black">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-white/60 bg-gradient-to-b from-black via-[#0A0A0A] to-black">
        <p>Swing analysis not found</p>
        <Button 
          variant="outline" 
          onClick={() => navigate('/hub/echo/history')}
          className="bg-white/05 border-white/20 text-white hover:bg-white/10"
        >
          Back to History
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-black via-[#0A0A0A] to-black">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/hub/echo/history')}
          className="text-white/80 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">{analysis.title}</div>
          <div className="text-xs text-white/60">
            {analysis.timestamp.toLocaleDateString()}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyLink()}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          {copiedId === 'main' ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4 max-w-3xl mx-auto">
          {/* Video */}
          {analysis.videoUrl && (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-white/10">
              <HLSVideoPlayer
                src={analysis.videoUrl}
                className="w-full h-full"
              />
            </div>
          )}

          {/* Analysis Content */}
          <div className="bg-white/05 rounded-lg p-4 border border-white/10">
            <div className="text-sm text-white/90 whitespace-pre-wrap">
              {analysis.content}
            </div>
          </div>

          {seekTime !== null && (
            <div className="text-xs text-white/40 text-center">
              Video seeking to {seekTime}s
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
