/**
 * FeedToggle - For You / Following toggle for Home feed
 * TikTok-style feed selector with underline indicator
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type FeedTab = 'for_you' | 'following';

interface FeedToggleProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  isVisible?: boolean;
  className?: string;
}

export const FeedToggle: React.FC<FeedToggleProps> = ({
  activeTab,
  onTabChange,
  isVisible = true,
  className,
}) => {
  const tabs: { id: FeedTab; label: string }[] = [
    { id: 'for_you', label: 'For You' },
    { id: 'following', label: 'Following' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        y: isVisible ? 0 : -10 
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-[60]',
        'flex items-center gap-6',
        'pointer-events-auto',
        className
      )}
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative px-2 py-2',
              'text-base font-bold tracking-tight',
              'transition-colors duration-150',
              isActive ? 'text-white' : 'text-white/50 hover:text-white/70'
            )}
          >
            {tab.label}
            
            {/* Active underline indicator */}
            {isActive && (
              <motion.div
                layoutId="feed-toggle-indicator"
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-white rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </motion.div>
  );
};

export default FeedToggle;
