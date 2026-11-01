/**
 * MS3 §4 — card data for the round_share messages on the loaded thread page.
 * ONE get_round_share_cards call per page, keyed on the sorted message ids.
 * The server returns rows only for conversations the member is in and only
 * when the round belongs to the message's sender; a message with no row
 * renders its body as a normal bubble (MessageBubble owns that fallback).
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ThreadMessage } from '@/types/messaging';

export interface RoundShareCard {
  message_id: string;
  whs_score_id: string;
  course_id: string;
  course_name: string;
  play_date: string;
  gross: number;
  to_par: number;
  holes_played: number;
  hole_to_par: number[];
}

export function useRoundShareCards(messages: ThreadMessage[]) {
  // Optimistic rows have client ids, not uuids — never send them to the RPC.
  const ids = useMemo(
    () =>
      [
        ...new Set(
          messages
            .filter((m) => m.type === 'round_share' && !m.id.startsWith('optimistic-'))
            .map((m) => m.id),
        ),
      ].sort(),
    [messages],
  );
  const key = ids.join(',');

  const query = useQuery({
    queryKey: ['round-share-cards', key],
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<RoundShareCard[]> => {
      const { data, error } = await supabase.rpc('get_round_share_cards' as never, {
        p_message_ids: ids,
      } as never);
      if (error) throw error;
      return (data ?? []) as unknown as RoundShareCard[];
    },
  });

  return useMemo(() => {
    const map: Record<string, RoundShareCard> = {};
    for (const row of query.data ?? []) map[row.message_id] = row;
    return map;
  }, [query.data]);
}
