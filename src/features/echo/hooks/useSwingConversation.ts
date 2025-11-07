import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ConversationMessage = {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
};

export function useSwingConversation(swingId?: string) {
  return useQuery({
    queryKey: ['swing-conversation', swingId],
    enabled: !!swingId,
    queryFn: async (): Promise<ConversationMessage[]> => {
      if (!swingId) return [];

      const { data, error } = await supabase
        .from('pro_ai_analyses')
        .select('analysis_results')
        .eq('id', swingId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return [];

      // Extract conversation from analysis_results.conversation
      const results = data.analysis_results as any;
      const conversation = results?.conversation;
      if (!Array.isArray(conversation)) return [];

      return conversation.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));
    },
  });
}
