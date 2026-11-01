/**
 * MS2 §2 — the people who played the member's most recent round (last 60
 * days) at the same course on the same day, from get_my_last_fourball.
 * Up to three rows; blocked people are excluded server-side. Read only while
 * the New message sheet is open; the card renders only for 2 or 3 people.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FourballMember {
  user_id: string;
  display_name: string;
  username: string;
  profile_photo_url: string | null;
  course_name: string;
  play_date: string;
}

export function useLastFourball(userId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['msg-last-fourball', userId ?? ''],
    queryFn: async (): Promise<FourballMember[]> => {
      const { data, error } = await supabase.rpc('get_my_last_fourball' as never);
      if (error) throw error;
      return ((data ?? []) as unknown as FourballMember[]).slice(0, 3);
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
