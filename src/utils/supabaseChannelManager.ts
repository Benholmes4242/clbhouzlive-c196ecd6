import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

class SupabaseChannelManager {
  private static instance: SupabaseChannelManager;
  private channels: Map<string, RealtimeChannel> = new Map();

  private constructor() {}

  static getInstance(): SupabaseChannelManager {
    if (!SupabaseChannelManager.instance) {
      SupabaseChannelManager.instance = new SupabaseChannelManager();
    }
    return SupabaseChannelManager.instance;
  }

  createChannel(channelName: string, options?: any): RealtimeChannel {
    // Reuse existing channel if it exists to prevent unsubscribing other listeners
    const existing = this.channels.get(channelName);
    if (existing) {
      console.log(`Reusing existing channel: ${channelName}`);
      return existing;
    }

    console.log(`Creating new channel: ${channelName}`);
    const channel = supabase.channel(channelName, options as any);
    this.channels.set(channelName, channel);
    return channel;
  }

  removeChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      console.log(`Removing channel: ${channelName}`);
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  removeAllChannels(): void {
    console.log('Removing all channels');
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  hasChannel(channelName: string): boolean {
    return this.channels.has(channelName);
  }
}

export const channelManager = SupabaseChannelManager.getInstance();