// Module-level registry that lets useThread / useConversations expose their
// active realtime channel and a resubscribe callback to useMessagingResume,
// without the resume hook having to reach into supabase internals or
// duplicate channel definitions.

import type { RealtimeChannel } from '@supabase/supabase-js';

export interface MessagingChannelEntry {
  getChannel: () => RealtimeChannel | null;
  resubscribe: () => void;
}

const entries = new Set<MessagingChannelEntry>();

export function registerMessagingChannel(entry: MessagingChannelEntry): () => void {
  entries.add(entry);
  return () => {
    entries.delete(entry);
  };
}

export function getRegisteredMessagingChannels(): MessagingChannelEntry[] {
  return Array.from(entries);
}
