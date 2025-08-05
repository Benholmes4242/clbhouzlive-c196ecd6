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

  createChannel(channelName: string): RealtimeChannel {
    // If channel already exists, remove it first
    if (this.channels.has(channelName)) {
      console.log(`Removing existing channel: ${channelName}`);
      this.removeChannel(channelName);
    }

    console.log(`Creating new channel: ${channelName}`);
    const channel = supabase.channel(channelName);
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