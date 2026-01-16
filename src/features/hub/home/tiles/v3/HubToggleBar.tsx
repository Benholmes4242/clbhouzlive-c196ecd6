/**
 * HubToggleBar - Echo-styled toggle bar for Messages/Echo/Create Game
 * Animated pill highlight with spring transition
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, Plus } from 'lucide-react';
import { haptic } from '@/utils/haptics';

type ToggleKey = 'messages' | 'echo' | 'create';

interface HubToggleBarProps {
  activeToggle: ToggleKey | null;
  onToggle: (key: ToggleKey) => void;
}

const toggleItems: { key: ToggleKey; label: string; icon: typeof MessageSquare }[] = [
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'echo', label: 'Echo', icon: Sparkles },
  { key: 'create', label: 'Create Game', icon: Plus },
];

export function HubToggleBar({ activeToggle, onToggle }: HubToggleBarProps) {
  return (
    <div
      className="mx-5 p-1 rounded-[16px] flex"
      style={{ 
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
      }}
    >
      {toggleItems.map((item) => {
        const isActive = activeToggle === item.key;
        const isEcho = item.key === 'echo';
        const Icon = item.icon;

        return (
          <button
            key={item.key}
            onClick={() => {
              haptic('light');
              onToggle(item.key);
            }}
            className="relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] transition-colors"
          >
            {isActive && (
              <motion.div
                layoutId="hub-toggle-pill"
                className="absolute inset-0 rounded-[12px]"
                style={isEcho ? {
                  background: 'rgba(251, 191, 36, 0.15)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  boxShadow: '0 2px 8px rgba(251, 191, 36, 0.15)',
                } : {
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon
                className="h-4 w-4"
                style={{ color: isActive && isEcho ? '#F59E0B' : isActive ? '#1e293b' : '#64748b' }}
              />
              <span
                className="text-[13px] font-medium"
                style={{ color: isActive ? '#1e293b' : '#64748b' }}
              >
                {item.label}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
