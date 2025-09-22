import { useState, useCallback, useRef, useEffect } from 'react';
import { AnalysisSessionService } from '@/services/swing/analysisSession';
import { SessionState, PhaseName } from '@/types/swingSession';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseSwingSessionReturn {
  sessionState: SessionState | null;
  isLoading: boolean;
  error: string | null;
  analysisId: string | undefined;
  startSession: (params: { uploadId?: string; videoUrl?: string; videoFile?: File }) => Promise<void>;
  disconnect: () => void;
}

export function useSwingSession(): UseSwingSessionReturn {
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | undefined>();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const summarizingRef = useRef(false);
  const seenDoneEvents = useRef(new Set<string>());
  const { toast } = useToast();

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttempts.current = 0;
  }, []);

  const connectSSE = useCallback(async (sessionId: string) => {
    try {
      disconnect(); // Clean up any existing connection
      
      const eventSource = await AnalysisSessionService.createEventSource(sessionId);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connected successfully');
        reconnectAttempts.current = 0;
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleSSEMessage(data);
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      eventSource.addEventListener('status', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          handleSSEMessage(data);
        } catch (err) {
          console.error('Error parsing status event:', err);
        }
      });

      eventSource.addEventListener('done', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          handleSSEMessage(data);
        } catch (err) {
          console.error('Error parsing done event:', err);
        }
      });

      eventSource.addEventListener('error', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          handleSSEMessage(data);
        } catch (err) {
          console.error('Error parsing error event:', err);
        }
      });

      eventSource.onerror = (event) => {
        console.error('SSE error:', event);
        
        // Exponential backoff for reconnection
        if (reconnectAttempts.current < 5) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000;
          reconnectAttempts.current++;
          
          reconnectTimeoutRef.current = setTimeout(async () => {
            console.log(`Reconnecting SSE (attempt ${reconnectAttempts.current})...`);
            await connectSSE(sessionId);
          }, delay);
        } else {
          setError('Lost connection to analysis service');
          toast({
            title: "Connection lost",
            description: "Unable to receive real-time updates",
            variant: "destructive"
          });
        }
      };

    } catch (err) {
      console.error('Error creating SSE connection:', err);
      setError('Failed to connect to analysis service');
    }
  }, [disconnect, toast]);

  // Separate function for handling summarization
  const handleSummarization = useCallback(async (sessionId: string) => {
    console.log('Analysis complete, starting summarization...');
    
    try {
      const result = await AnalysisSessionService.summarize(sessionId);
      setSessionState(prev => prev ? {
        ...prev,
        summary: {
          text: result.text,
          createdAt: new Date().toISOString(),
          analysisId: result.analysisId,
          analysisResults: result.analysisResults
        }
      } : prev);
      
      toast({
        title: "Analysis Complete",
        description: "Your swing analysis is ready with personalized recommendations",
      });
    } catch (err) {
      console.error('Summarization failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate summary';
      
      // If it's a retry error (409), don't show as failure - just wait
      if (!errorMessage.includes('Insufficient phase data')) {
        toast({
          title: "Analysis Summary Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  const handleSSEMessage = useCallback((data: any) => {
    console.log('SSE message received:', data);

    setSessionState(prev => {
      if (!prev) return prev;

      const updated = { ...prev };

      switch (data.type) {
        case 'status':
          if (data.phase && updated.phases[data.phase as PhaseName]) {
            updated.phases[data.phase as PhaseName] = {
              ...updated.phases[data.phase as PhaseName],
              status: data.status === 'started' ? 'running' : data.status
            };
          }
          break;

        case 'progress':
          if (data.phase && updated.phases[data.phase as PhaseName]) {
            updated.phases[data.phase as PhaseName] = {
              ...updated.phases[data.phase as PhaseName],
              status: 'running'
            };
          }
          break;

        case 'partial':
          if (data.phase && updated.phases[data.phase as PhaseName]) {
            updated.phases[data.phase as PhaseName] = {
              ...updated.phases[data.phase as PhaseName],
              frameIndex: data.frameIndex
            };
            updated.activeFrameIndex = data.frameIndex;
          }
          break;

        case 'done':
          if (data.phase && updated.phases[data.phase as PhaseName]) {
            updated.phases[data.phase as PhaseName] = {
              status: 'done',
              frameIndex: data.frameIndex,
              metrics: data.metrics,
              tips: data.tips,
              visualPlan: data.visualPlan
            };
            updated.activeFrameIndex = data.frameIndex;
            seenDoneEvents.current.add(data.phase);
          }
          break;

        case 'error':
          if (data.phase && updated.phases[data.phase as PhaseName]) {
            updated.phases[data.phase as PhaseName] = {
              ...updated.phases[data.phase as PhaseName],
              status: 'error',
              error: data.message
            };
          }
          toast({
            title: `Error in ${data.phase} analysis`,
            description: data.message,
            variant: "destructive"
          });
          break;

        case 'complete':
          // If backend already provided analysisId, use it
          if (data.summaryReady && data.analysisId) {
            setAnalysisId(data.analysisId);
            return updated;
          }
          
          // Check if we can summarize based on server doneCount or client-side done events
          const canSummarize = (data.doneCount ?? seenDoneEvents.current.size) >= 3;
          console.log(`Complete event: doneCount=${data.doneCount}, seenDoneEvents=${seenDoneEvents.current.size}, canSummarize=${canSummarize}`);
          
          if (canSummarize && !summarizingRef.current) {
            summarizeOnce(updated.sessionId);
          }
          break;
      }

      return updated;
    });
  }, [toast, handleSummarization]);

  // Enhanced summarization with exponential backoff
  const summarizeOnce = useCallback(async (sessionId: string) => {
    if (summarizingRef.current) return;
    summarizingRef.current = true;
    
    let delay = 2000;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        console.log(`Summarization attempt ${attempt + 1}/4`);
        const response = await fetch('/functions/v1/swing-summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ sessionId })
        });
        
        if (response.ok) {
          const result = await response.json();
          setAnalysisId(result.analysisId);
          setSessionState(prev => prev ? {
            ...prev,
            summary: {
              text: result.text || 'Analysis completed successfully',
              createdAt: new Date().toISOString(),
              analysisId: result.analysisId,
              analysisResults: result.analysisResults
            }
          } : prev);
          
          toast({
            title: "Analysis Complete",
            description: "Your swing analysis is ready with personalized recommendations",
          });
          break; // Success, exit retry loop
        }
        
        if (response.status !== 409) {
          // Non-retryable error
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        // 409 - retry with exponential backoff
        if (attempt < 3) {
          console.log(`409 Insufficient phase data, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.round(delay * 1.75);
        } else {
          throw new Error('Failed to generate summary after multiple attempts');
        }
        
      } catch (err: any) {
        console.error(`Summarization attempt ${attempt + 1} failed:`, err);
        
        if (attempt === 3) {
          // Final attempt failed
          toast({
            title: "Analysis Summary Failed",
            description: err.message || 'Failed to generate summary after multiple attempts',
            variant: "destructive"
          });
          break;
        }
      }
    }
    
    summarizingRef.current = false;
  }, [toast]);

  const startSession = useCallback(async (params: { uploadId?: string; videoUrl?: string; videoFile?: File }) => {
    setIsLoading(true);
    setError(null);
    seenDoneEvents.current.clear(); // Reset done events tracker
    
    try {
      const session = await AnalysisSessionService.startSession(params);
      setSessionState(session);
      
      // Connect to SSE stream
      await connectSSE(session.sessionId);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session';
      setError(errorMessage);
      toast({
        title: "Analysis failed to start",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [connectSSE, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    sessionState,
    isLoading,
    error,
    analysisId,
    startSession,
    disconnect
  };
}