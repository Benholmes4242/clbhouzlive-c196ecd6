import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * SupabaseChannelManager - Singleton for managing Supabase Realtime channels
 * 
 * STABILITY FIX: Added reference counting to support multiple subscribers to the same channel.
 * - createChannel increments refCount
 * - removeChannel decrements refCount
 * - Channel is only removed when refCount reaches 0
 */
class SupabaseChannelManager {
  private static instance: SupabaseChannelManager;
  private channels: Map<string, RealtimeChannel> = new Map();
  private refCounts: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): SupabaseChannelManager {
    if (!SupabaseChannelManager.instance) {
      SupabaseChannelManager.instance = new SupabaseChannelManager();
    }
    return SupabaseChannelManager.instance;
  }

  /**
   * Create or get a channel, incrementing its reference count
   * Multiple components can safely share the same channel
   */
  createChannel(channelName: string, options?: any): RealtimeChannel {
    // Reuse existing channel if it exists to prevent unsubscribing other listeners
    const existing = this.channels.get(channelName);
    if (existing) {
      // Increment reference count
      const currentCount = this.refCounts.get(channelName) || 1;
      this.refCounts.set(channelName, currentCount + 1);
      console.log(`Reusing existing channel: ${channelName} (refs: ${currentCount + 1})`);
      return existing;
    }

    console.log(`Creating new channel: ${channelName}`);
    const channel = supabase.channel(channelName, options as any);
    this.channels.set(channelName, channel);
    this.refCounts.set(channelName, 1);
    return channel;
  }

  /**
   * Remove a channel reference, only actually removing when all refs are gone
   */
  removeChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      const currentCount = this.refCounts.get(channelName) || 1;
      const newCount = currentCount - 1;
      
      if (newCount <= 0) {
        // Actually remove the channel when all references are gone
        console.log(`Removing channel: ${channelName} (no more refs)`);
        supabase.removeChannel(channel);
        this.channels.delete(channelName);
        this.refCounts.delete(channelName);
      } else {
        // Just decrement the reference count
        console.log(`Releasing channel ref: ${channelName} (refs remaining: ${newCount})`);
        this.refCounts.set(channelName, newCount);
      }
    }
  }

  /**
   * Force remove a channel regardless of reference count
   * Use sparingly - mainly for cleanup during app shutdown
   */
  forceRemoveChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      console.log(`Force removing channel: ${channelName}`);
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.refCounts.delete(channelName);
    }
  }

  removeAllChannels(): void {
    console.log('Removing all channels');
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.refCounts.clear();
  }

  hasChannel(channelName: string): boolean {
    return this.channels.has(channelName);
  }

  getRefCount(channelName: string): number {
    return this.refCounts.get(channelName) || 0;
  }
}

export const channelManager = SupabaseChannelManager.getInstance();
