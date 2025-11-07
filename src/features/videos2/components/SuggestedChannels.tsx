import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ChannelLite } from '../types';

type SuggestedChannelsProps = {
  channels: ChannelLite[];
  onSubscribe: (channelId: string) => void;
};

export function SuggestedChannels({ channels, onSubscribe }: SuggestedChannelsProps) {
  const [subscribed, setSubscribed] = useState<Set<string>>(
    new Set(channels.filter(c => c.subscribed).map(c => c.id))
  );

  const handleSubscribe = (channelId: string) => {
    const newSubscribed = new Set(subscribed);
    if (subscribed.has(channelId)) {
      newSubscribed.delete(channelId);
    } else {
      newSubscribed.add(channelId);
    }
    setSubscribed(newSubscribed);
    onSubscribe(channelId);
  };

  return (
    <div className="bg-[#111] rounded-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <h3 className="text-white font-semibold text-lg mb-4">Suggested Channels</h3>
      
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {channels.map((channel) => (
          <motion.div
            key={channel.id}
            className="flex-shrink-0 flex flex-col items-center gap-2 w-32"
            whileHover={{ y: -2 }}
          >
            {/* Avatar */}
            <div className="relative">
              <img
                src={channel.avatar}
                alt={channel.name}
                className="w-20 h-20 rounded-full bg-gray-800 object-cover"
              />
              {channel.verified && (
                <div className="absolute bottom-0 right-0 bg-[#6e9277] rounded-full p-1">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </div>

            {/* Name */}
            <div className="text-center">
              <p className="text-white font-medium text-sm truncate w-full">
                {channel.name}
              </p>
            </div>

            {/* Subscribe button */}
            <button
              onClick={() => handleSubscribe(channel.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                subscribed.has(channel.id)
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-[#6e9277] text-white hover:bg-[#6e9277]/90'
              }`}
            >
              {subscribed.has(channel.id) ? 'Subscribed' : 'Subscribe'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
