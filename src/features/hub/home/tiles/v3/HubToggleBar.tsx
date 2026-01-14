/**
 * HubToggleBar - Echo-styled toggle bar for Messages/Echo/Create
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
  { key: 'create', label: 'Create', icon: Plus },
];

export function HubToggleBar({ activeToggle, onToggle }: HubToggleBarProps) {
  return (
    <div
      className="mx-5 p-1 rounded-[14px] flex"
      style={{ background: '#e2e8f0' }}
    >
      {toggleItems.map((item) => {
        const isActive = activeToggle === item.key;
        const Icon = item.icon;

        return (
          <button
            key={item.key}
            onClick={() => {
              haptic('light');
              onToggle(item.key);
            }}
            className="relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] transition-colors"
          >
            {isActive && (
              <motion.div
                layoutId="hub-toggle-pill"
                className="absolute inset-0 rounded-[10px]"
                style={{
                  background: '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon
                className="h-4 w-4"
                style={{ color: isActive ? '#F97316' : '#64748b' }}
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
