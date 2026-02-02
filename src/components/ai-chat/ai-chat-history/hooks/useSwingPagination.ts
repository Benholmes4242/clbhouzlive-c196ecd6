/**
 * useSwingPagination Hook
 * Handles pagination for swing analyses from Supabase
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SwingAnalysis } from '../types';

const PAGE_SIZE = 20;

interface UseSwingPaginationReturn {
  swingAnalyses: SwingAnalysis[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  loadPage: (nextPage?: number) => Promise<void>;
  deleteSwingAnalysis: (id: string) => void;
  setSwingAnalyses: React.Dispatch<React.SetStateAction<SwingAnalysis[]>>;
}

export function useSwingPagination(): UseSwingPaginationReturn {
  const [swingAnalyses, setSwingAnalyses] = useState<SwingAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const loadPage = useCallback(async (nextPage = 0) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSwingAnalyses([]);
        setHasMore(false);
        return;
      }

      const from = nextPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error: dbError, count } = await supabase
        .from('pro_ai_analyses')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (dbError) {
        console.error('Error loading swing analyses:', dbError);
        setError('Failed to load swing analyses. Please try again.');
        setHasMore(false);
        return;
      }

      const formattedAnalyses: SwingAnalysis[] = (data ?? []).map(analysis => {
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
          category: analysisResults?.metadata?.category || 'Swing',
          content: analysisResults?.aiResponse || '',
          tags: analysisResults?.metadata?.tags || [],
          videoUrl: analysis.video_url,
          videoThumbnail: swingContext.videoThumbnail || null,
          timestamp: new Date(analysis.created_at)
        };
      });

      setHasMore((from + formattedAnalyses.length) < (count ?? 0));
      setSwingAnalyses(prev => nextPage === 0 ? formattedAnalyses : [...prev, ...formattedAnalyses]);
      setPage(nextPage);

      console.log('✅ [useSwingPagination] Loaded:', {
        page: nextPage,
        loaded: formattedAnalyses.length,
        total: count,
        hasMore: (from + formattedAnalyses.length) < (count ?? 0)
      });
    } catch (err) {
      console.error('Failed to load swing analyses:', err);
      setError('Failed to load swing analyses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const deleteSwingAnalysis = useCallback((id: string) => {
    setSwingAnalyses(prev => prev.filter(analysis => analysis.id !== id));
  }, []);

  return {
    swingAnalyses,
    isLoading,
    error,
    hasMore,
    page,
    loadPage,
    deleteSwingAnalysis,
    setSwingAnalyses
  };
}
