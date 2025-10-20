import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReviewResponse } from '../types';
import { OPEN2PLAY_CONFIG } from '../config';
import { mockStore, getMockUserProfile } from '../mock/mockData';

export function useReviewResponder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const review = async (
    pingId: string,
    responseId: string,
    decision: 'ACCEPT' | 'DECLINE'
  ): Promise<ReviewResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      if (OPEN2PLAY_CONFIG.dataSource === 'mock') {
        return reviewMockResponse(pingId, responseId, decision);
      }

      const { data, error } = await supabase.functions.invoke(`pings/${pingId}/review`, {
        body: { responseId, decision },
        method: 'POST',
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to review response');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { review, loading, error };
}

function reviewMockResponse(
  pingId: string,
  responseId: string,
  decision: 'ACCEPT' | 'DECLINE'
): ReviewResponse {
  const ping = mockStore.pings.find(p => p.id === pingId);
  if (!ping) {
    throw new Error('UNAUTHORIZED');
  }

  const response = mockStore.responses.find(r => r.id === responseId);
  if (!response) {
    throw new Error('Response not found');
  }

  response.state = decision === 'ACCEPT' ? ('ACCEPTED' as const) : ('DECLINED' as const);
  response.updated_at = new Date().toISOString();

  const result: ReviewResponse = {
    result: decision === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED',
  };

  if (decision === 'ACCEPT') {
    // Create mock match
    mockStore.matches.push({
      id: `mock-match-${Date.now()}`,
      ping_id: pingId,
      participant_ids: [ping.creator_id, response.responder_id],
      created_at: new Date().toISOString(),
    });

    // Reveal profile if anonymous
    if (ping.is_anonymous) {
      result.revealedProfile = getMockUserProfile(ping.creator_id);
    }

    result.responder = getMockUserProfile(response.responder_id);
  }

  console.log('[Mock] Reviewed response:', decision);
  return result;
}
