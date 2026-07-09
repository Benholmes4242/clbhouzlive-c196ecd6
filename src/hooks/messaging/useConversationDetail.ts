import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ConversationDetail, ConversationMember } from '@/types/messaging';

interface RawRow {
  conversation_id: string;
  type: string;
  title: string | null;
  avatar_url: string | null;
  created_by_user: string;
  created_at: string;
  members: unknown;
}

export function useConversationDetail(conversationId: string | null) {
  const query = useQuery<ConversationDetail | null>({
    queryKey: ['messaging', 'detail', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      if (!conversationId) return null;
      const { data, error } = await supabase.rpc('get_conversation_detail', {
        p_conversation_id: conversationId,
      });
      if (error) throw error;
      const rows = (data as unknown as RawRow[]) ?? [];
      const row = rows[0];
      if (!row) return null;
      const members: ConversationMember[] = Array.isArray(row.members)
        ? (row.members as ConversationMember[])
        : [];
      return {
        conversation_id: row.conversation_id,
        type: row.type as ConversationDetail['type'],
        title: row.title,
        avatar_url: row.avatar_url,
        created_by_user: row.created_by_user,
        created_at: row.created_at,
        members,
      };
    },
  });

  return {
    detail: query.data ?? null,
    members: query.data?.members ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
