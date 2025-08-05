import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

class SubscriptionManager {
  private static instance: SubscriptionManager;
  private activeChannels: Map<string, RealtimeChannel> = new Map();

  private constructor() {}

  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  createSubscription(channelName: string, subscriptionConfig: any): RealtimeChannel {
    // If a channel with this name already exists, remove it first
    if (this.activeChannels.has(channelName)) {
      console.log(`Removing existing channel: ${channelName}`);
      const existingChannel = this.activeChannels.get(channelName)!;
      supabase.removeChannel(existingChannel);
      this.activeChannels.delete(channelName);
    }

    console.log(`Creating new subscription: ${channelName}`);
    
    // Create new channel
    const channel = supabase.channel(channelName);
    
    // Apply the subscription configuration
    let configuredChannel = channel;
    subscriptionConfig.forEach((config: any) => {
      configuredChannel = configuredChannel.on(
        config.event,
        config.options,
        config.callback
      );
    });

    // Subscribe to the channel
    configuredChannel.subscribe();
    
    // Store the channel reference
    this.activeChannels.set(channelName, configuredChannel);
    
    return configuredChannel;
  }

  removeSubscription(channelName: string): void {
    if (this.activeChannels.has(channelName)) {
      console.log(`Removing subscription: ${channelName}`);
      const channel = this.activeChannels.get(channelName)!;
      supabase.removeChannel(channel);
      this.activeChannels.delete(channelName);
    }
  }

  removeAllSubscriptions(): void {
    console.log('Removing all subscriptions');
    this.activeChannels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    this.activeChannels.clear();
  }

  getActiveChannels(): string[] {
    return Array.from(this.activeChannels.keys());
  }
}

export const subscriptionManager = SubscriptionManager.getInstance();