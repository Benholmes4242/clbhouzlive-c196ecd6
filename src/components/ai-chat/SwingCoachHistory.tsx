import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { HistorySwingCard } from '@/components/swing/HistorySwingCard';
import { CoachPickerModal } from '@/components/swing/CoachPickerModal';
import { Eye } from 'lucide-react';

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

export const SwingCoachHistory: React.FC = () => {
  const [analyses, setAnalyses] = useState<SwingAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCoachPicker, setShowCoachPicker] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { toast } = useToast();

  useEffect(() => {
    if (!sessionLoading && user) {
      loadAnalyses();
    }
  }, [user, sessionLoading]);

  const loadAnalyses = async () => {
    try {
      if (!user) {
        console.log('No authenticated user for loading analyses');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('pro_ai_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading analyses:', error);
        return;
      }

      if (data) {
        const formattedAnalyses = data.map(analysis => {
          const analysisResults = analysis.analysis_results as any;
          const swingContextData = analysis.swing_context as string;
          
          let swingContext: any = {};
          try {
            if (swingContextData) {
              swingContext = JSON.parse(swingContextData);
            }
          } catch (e) {
            console.error('Error parsing swing context:', e);
          }

          return {
            id: analysis.id,
            save_card: analysisResults?.metadata?.save_card || 'Swing Analysis',
            tags: analysisResults?.metadata?.tags || [],
            category: analysisResults?.metadata?.category || 'Swing',
            content: analysisResults?.aiResponse || '',
            videoUrl: analysis.video_url,
            timestamp: new Date(analysis.created_at),
            videoId: swingContext.videoId || null,
            videoThumbnail: swingContext.videoThumbnail || null
          };
        });
        setAnalyses(formattedAnalyses);
      }
    } catch (error) {
      console.error('Error loading analyses:', error);
      toast({
        title: "Error loading analyses",
        description: "Could not load your swing history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCoachPicker = (analysisId: string) => {
    setSelectedAnalysisId(analysisId);
    setShowCoachPicker(true);
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    try {
      const { error } = await supabase
        .from('pro_ai_analyses')
        .delete()
        .eq('id', analysisId);

      if (error) throw error;

      setAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
      
      toast({
        title: "Analysis deleted",
        description: "The swing analysis has been removed"
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete the analysis",
        variant: "destructive"
      });
    }
  };

  const renderEmptyState = () => (
    <div className="text-center py-12 space-y-4">
      <Eye className="h-12 w-12 text-muted-foreground mx-auto" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">No swing analyses yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Upload your first swing video in the SwingCoach tab to get started with AI-powered analysis.
        </p>
      </div>
    </div>
  );

  if (sessionLoading || isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading analyses...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Eye className="h-12 w-12 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Please sign in</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              You need to be signed in to view your swing analysis history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold">Swing History</h2>
        <p className="text-sm text-muted-foreground">
          Review your previous swing analyses and coach feedback
        </p>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {analyses.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <HistorySwingCard
                  key={analysis.id}
                  analysis={analysis}
                  onOpenCoachPicker={handleOpenCoachPicker}
                  onDelete={handleDeleteAnalysis}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Coach Picker Modal */}
      {showCoachPicker && selectedAnalysisId && (
        <CoachPickerModal
          isOpen={showCoachPicker}
          onClose={() => {
            setShowCoachPicker(false);
            setSelectedAnalysisId(null);
          }}
          analysisId={selectedAnalysisId}
          onShareComplete={() => {
            setShowCoachPicker(false);
            setSelectedAnalysisId(null);
            toast({
              title: "Share request sent",
              description: "The coach will receive your swing analysis"
            });
          }}
        />
      )}
    </div>
  );
};