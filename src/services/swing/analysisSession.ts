import { supabase } from '@/integrations/supabase/client';
import { SessionState, PhaseName } from '@/types/swingSession';

export class AnalysisSessionService {
  private static PROJECT_URL = 'https://ybxkehyomcakqjvuhnna.supabase.co';

  static async startSession(params: { uploadId?: string; videoUrl?: string }): Promise<SessionState> {
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

    return {
      sessionId: data.sessionId,
      phases,
      order: data.phases,
      frames: data.frames,
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

  static async summarize(sessionId: string): Promise<{ analysisId: string; text: string }> {
    // Feature gated - return mock for now
    const mockAnalysisId = crypto.randomUUID();
    const mockText = "Analysis summary will be available soon...";
    
    // TODO: Implement actual summarization endpoint
    console.log('Summarization requested for session:', sessionId);
    
    return {
      analysisId: mockAnalysisId,
      text: mockText
    };
  }
}