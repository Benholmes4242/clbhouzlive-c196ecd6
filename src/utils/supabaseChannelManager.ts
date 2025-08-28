import { secureSupabase as supabase } from '@/integrations/supabase/secureClient';
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
    
    try {
      // Create channel with basic configuration
      const channel = supabase.channel(channelName);
      this.channels.set(channelName, channel);
      return channel;
    } catch (error) {
      console.error(`Failed to create channel ${channelName}:`, error);
      // Return a basic channel as fallback
      const fallbackChannel = supabase.channel(`fallback_${channelName}`);
      this.channels.set(channelName, fallbackChannel);
      return fallbackChannel;
    }
  }

  removeChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      console.log(`Removing channel: ${channelName}`);
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn(`Error removing channel ${channelName}:`, error);
      }
      this.channels.delete(channelName);
    }
  }

  removeAllChannels(): void {
    console.log('Removing all channels');
    this.channels.forEach((channel, name) => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn(`Error removing channel ${name}:`, error);
      }
    });
    this.channels.clear();
  }

  hasChannel(channelName: string): boolean {
    return this.channels.has(channelName);
  }
}

export const channelManager = SupabaseChannelManager.getInstance();