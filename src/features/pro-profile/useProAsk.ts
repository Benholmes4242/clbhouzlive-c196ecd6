/** Ask reads are profile-keyed and fail closed; every write invalidates both
 * the public answers key and the pro's inbox keys. The enabled flag is read
 * with the answers payload so one settled read decides whether the section
 * exists at all. */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  parseProAnswers,
  parseProInbox,
  type ProAnswersPayload,
  type ProInboxRow,
} from './proAskRules';

export const askKey = (proId: string) => ['pro-profile', 'ask', proId] as const;
export const askInboxKey = (status: 'waiting' | 'answered') => ['pro-profile', 'ask-inbox', status] as const;

export function useProAnswers(proId: string, limit = 3, offset = 0) {
  return useQuery({
    queryKey: [...askKey(proId), limit, offset],
    enabled: !!proId,
    queryFn: async (): Promise<ProAnswersPayload> => {
      const { data, error } = await supabase.rpc('get_pro_answers', { p_pro_id: proId, p_limit: limit, p_offset: offset });
      if (error) throw error;
      const parsed = parseProAnswers(data);
      if (!parsed) throw new Error('Bad answers payload');
      return parsed;
    },
  });
}

export function useProInbox(status: 'waiting' | 'answered', enabled: boolean) {
  return useQuery({
    queryKey: askInboxKey(status),
    enabled,
    queryFn: async (): Promise<ProInboxRow[]> => {
      const { data, error } = await supabase.rpc('get_pro_question_inbox', { p_status: status });
      if (error) throw error;
      return parseProInbox(data);
    },
  });
}

/** The asker's own home club and its visibility, for the privacy line. */
export function useMyAskerLabel(viewerId: string | undefined) {
  return useQuery({
    queryKey: ['pro-profile', 'asker-label', viewerId],
    enabled: !!viewerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('home_club, home_club_visibility')
        .eq('id', viewerId!)
        .maybeSingle();
      if (error) throw error;
      const club = typeof data?.home_club === 'string' && data.home_club ? data.home_club : null;
      return { club, public: !!club && data?.home_club_visibility !== 'private' };
    },
  });
}

export function useProAskWrite(proId: string) {
  const cache = useQueryClient();
  return async (action: () => PromiseLike<{ error: { message: string } | null }>): Promise<boolean> => {
    try {
      const { error } = await action();
      if (error) throw error;
      await Promise.all([
        cache.invalidateQueries({ queryKey: askKey(proId) }),
        cache.invalidateQueries({ queryKey: ['pro-profile', 'ask-inbox'] }),
      ]);
      return true;
    } catch (e) {
      // Function refusals are shown word for word.
      toast.error(e && typeof e === 'object' && 'message' in e ? String(e.message) : 'Could not save. Please try again.');
      return false;
    }
  };
}
