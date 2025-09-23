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
  debugState: () => void;
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
      
      // Create EventSource with custom implementation to support headers
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const url = `https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/swing-stream-proxy?sessionId=${encodeURIComponent(sessionId)}`;
      
      // Use fetch-based EventSource alternative for header support
      const abortController = new AbortController();
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('session-expired');
          toast({
            title: "Session expired",
            description: "Please refresh and try again",
            variant: "destructive"
          });
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      console.log('SSE connected successfully via proxy');
      reconnectAttempts.current = 0;
      setError(null);

      // Parse SSE stream manually
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processSSEData = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            console.log('SSE stream ended');
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          let eventType = '';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7);
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6);
            } else if (line === '' && eventData) {
              // End of event, process it
              try {
                if (eventData.trim()) {
                  const data = JSON.parse(eventData);
                  handleSSEMessage(data);
                }
              } catch (err) {
                // Don't crash on parse errors - log and continue
                console.warn('Failed to parse SSE event data:', eventData, err);
              }
              eventType = '';
              eventData = '';
            }
          }

          processSSEData(); // Continue reading
        }).catch(error => {
          if (error.name !== 'AbortError') {
            console.error('SSE read error:', error);
            handleReconnect();
          }
        });
      };

      processSSEData();

      // Store cleanup function
      eventSourceRef.current = {
        close: () => abortController.abort()
      } as EventSource;

    } catch (err) {
      console.error('Error creating SSE connection:', err);
      handleReconnect();
    }
  }, [disconnect, toast]);

  const handleReconnect = useCallback(() => {
    // Don't reconnect if we've hit max attempts or analysis is complete
    if (reconnectAttempts.current >= 5 || (sessionState?.completedAt && sessionState.completedAt > 0)) {
      if (reconnectAttempts.current >= 5) {
        setError('connection-failed');
        toast({
          title: "Connection lost",
          description: "Unable to receive real-time updates",
          variant: "destructive"
        });
      }
      return;
    }

    // Exponential backoff for reconnection
    const delay = Math.pow(2, reconnectAttempts.current) * 1000;
    reconnectAttempts.current++;
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      console.log(`Reconnecting SSE (attempt ${reconnectAttempts.current})...`);
      const currentSessionId = sessionState?.sessionId;
      if (currentSessionId) {
        await connectSSE(currentSessionId);
      }
    }, delay);
  }, [connectSSE, sessionState?.sessionId, sessionState?.completedAt, toast]);

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
          // Only update if phase isn't already done and status is 'started'
          if (data.phase && updated.phases[data.phase as PhaseName] && data.status === 'started') {
            const currentPhase = updated.phases[data.phase as PhaseName];
            if (currentPhase.status !== 'done') {
              updated.phases[data.phase as PhaseName] = {
                ...currentPhase,
                status: 'running'
              };
            }
          }
          break;

        case 'progress':
          // Ignore progress events to prevent state churn
          break;

        case 'partial':
          if (data.phase && updated.phases[data.phase as PhaseName]) {
            const sanitizedFrameIndex = sanitizeFrameIndex(data.frameIndex, updated.frames?.length || 20);
            updated.phases[data.phase as PhaseName] = {
              ...updated.phases[data.phase as PhaseName],
              frameIndex: sanitizedFrameIndex
            };
            updated.activeFrameIndex = sanitizedFrameIndex;
            updated.lastPartialAt = Date.now();
          }
          break;

        case 'done':
          if (data.phase && updated.phases[data.phase as PhaseName]) {
            const sanitizedFrameIndex = sanitizeFrameIndex(data.frameIndex, updated.frames?.length || 20);
            updated.phases[data.phase as PhaseName] = {
              status: 'done',
              frameIndex: sanitizedFrameIndex,
              metrics: data.metrics,
              tips: data.tips,
              visualPlan: data.visualPlan
            };
            updated.activeFrameIndex = sanitizedFrameIndex;
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
          
          // Stop reconnecting on unauthorized
          if (data.code === 'unauthorized') {
            reconnectAttempts.current = 999; // Prevent further reconnects
            setError('session-expired');
          }
          
          toast({
            title: `Error in ${data.phase} analysis`,
            description: data.message,
            variant: "destructive"
          });
          break;

        case 'complete':
          console.log('[SSE] Complete event received, marking analysis done');
          
          // Mark analysis complete immediately - don't wait for summary
          updated.analyzing = false;
          updated.completedAt = Date.now();
          updated.doneCount = data.doneCount ?? seenDoneEvents.current.size;
          updated.totalPhases = data.totalPhases ?? 7;
          
          // Stop reconnection attempts
          reconnectAttempts.current = 999;
          
          // Fire-and-forget summarization - don't block UI on it
          if ((data.doneCount ?? seenDoneEvents.current.size) >= 3 && !summarizingRef.current) {
            summarizeOnce(updated.sessionId).catch(err => {
              console.warn('[summarizeOnce] failed (non-blocking):', err);
            });
          }
          
          // Disconnect SSE after completion
          setTimeout(() => disconnect(), 1000);
          break;

        case 'heartbeat':
          // Ignore heartbeat events - no state updates, keep alive only
          break;

        default:
          console.debug('[SSE] Ignored unknown event:', data.type);
          break;
      }

      return updated;
    });
  }, [toast, disconnect]);

  // Helper function to sanitize frame index (1-based server → 0-based client, clamped)
  const sanitizeFrameIndex = (idx: number | undefined, totalFrames: number): number => {
    const frameIndex = Math.max(1, Math.min(Number(idx ?? 1), totalFrames));
    return frameIndex; // Keep 1-based for consistency with existing code
  };

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
      const sessionWithAnalyzing = {
        ...session,
        analyzing: true,
        lastPartialAt: Date.now()
      };
      setSessionState(sessionWithAnalyzing);
      
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

  // Local autoplay when SSE is disconnected and no recent partials
  useEffect(() => {
    if (!sessionState?.analyzing && sessionState?.frames && sessionState.frames.length > 1) {
      const autoplayInterval = setInterval(() => {
        setSessionState(prev => {
          if (!prev || !prev.frames) return prev;
          
          // Only autoplay if no recent partial events (stream is quiet)
          const timeSinceLastPartial = Date.now() - (prev.lastPartialAt || 0);
          if (timeSinceLastPartial < 3000) return prev; // Live stream is active
          
          const currentIndex = prev.activeFrameIndex || 1;
          const nextIndex = currentIndex >= prev.frames.length ? 1 : currentIndex + 1;
          
          return {
            ...prev,
            activeFrameIndex: nextIndex
          };
        });
      }, 1200); // 1.2s interval for autoplay
      
      return () => clearInterval(autoplayInterval);
    }
  }, [sessionState?.analyzing, sessionState?.frames]);

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
    disconnect,
    // Add debugging helper
    debugState: () => {
      console.log('[SwingSession Debug]', {
        analyzing: sessionState?.analyzing,
        completedAt: sessionState?.completedAt,
        doneCount: sessionState?.doneCount,
        totalPhases: sessionState?.totalPhases,
        phases: Object.entries(sessionState?.phases || {}).map(([name, phase]) => 
          `${name}: ${phase.status}`
        ),
        error,
        reconnectAttempts: reconnectAttempts.current
      });
    }
  };
}