import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type PresencePayload = {
  user_id: string;
  visibility_mode: 'hidden' | 'friends' | 'all';
  lat?: number | null;
  lng?: number | null;
  home_club?: string | null;
};

export function createNearbyPresenceChannel(): RealtimeChannel {
  return supabase.channel('nearby_presence_global', {
    config: { presence: { key: '' } }
  });
}
