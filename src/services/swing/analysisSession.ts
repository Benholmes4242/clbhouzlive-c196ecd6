import { supabase } from '@/integrations/supabase/client';
import { SessionState, PhaseName } from '@/types/swingSession';
import { extractFramesFromVideo, ExtractedFrame } from '@/utils/videoFrameExtraction';

export class AnalysisSessionService {
  private static PROJECT_URL = 'https://ybxkehyomcakqjvuhnna.supabase.co';

  static async startSession(params: { uploadId?: string; videoUrl?: string; videoFile?: File }): Promise<SessionState> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.PROJECT_URL}/functions/v1/swing-session-start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to start session: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Initialize session state
    const phases = {} as Record<PhaseName, any>;
    data.phases.forEach((phase: PhaseName) => {
      phases[phase] = { status: 'idle' };
    });

    // Extract real frames if video file is provided
    let frames = data.frames;
    if (params.videoFile) {
      try {
        console.log('Extracting frames from uploaded video...');
        const extractedFrames = await extractFramesFromVideo(params.videoFile, 20);
        frames = extractedFrames;
        console.log(`Successfully extracted ${frames.length} frames for analysis`);
      } catch (error) {
        console.warn('Failed to extract frames, using server frames:', error);
        // Fall back to server-provided frames (placeholders)
      }
    }

    return {
      sessionId: data.sessionId,
      phases,
      order: data.phases,
      frames,
    };
  }

  static async createEventSource(sessionId: string): Promise<EventSource> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const url = `${this.PROJECT_URL}/functions/v1/swing-session-stream?sessionId=${sessionId}&access_token=${session.access_token}`;
    return new EventSource(url);
  }

  static async getSession(sessionId: string) {
    // Note: These tables may not exist in the current schema yet
    // This is a placeholder for when the tables are created
    console.log('Getting session:', sessionId);
    return { id: sessionId, status: 'mock' };
  }

  static async summarize(sessionId: string): Promise<{ analysisId: string; text: string; analysisResults: any }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.PROJECT_URL}/functions/v1/swing-summarize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 409) {
        throw new Error(`Insufficient phase data. ${errorData.completedPhases || 0} phases completed. Please wait for more phases to finish.`);
      }
      throw new Error(`Summarization failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      analysisId: data.analysisId,
      text: data.analysisResults?.summary || 'Analysis complete',
      analysisResults: data.analysisResults
    };
  }
}