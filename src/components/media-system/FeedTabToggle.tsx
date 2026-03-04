import React from 'react';
import type { FeedTab } from './types/media';

interface FeedTabToggleProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        padding: '6px 18px',
        borderRadius: 17,
        border: 'none',
        background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
        color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
        fontSize: 14,
        fontWeight: isActive ? 600 : 500,
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}

export function FeedTabToggle({ activeTab, onTabChange }: FeedTabToggleProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'max(env(safe-area-inset-top, 0px), 47px)',
        left: 0,
        right: 0,
        zIndex: 30,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 0,
          background: 'rgba(0,0,0,0.35)',
          borderRadius: 20,
          padding: 3,
          pointerEvents: 'auto',
        }}
      >
        <TabButton
          label="Suggested"
          isActive={activeTab === 'suggested'}
          onClick={() => onTabChange('suggested')}
        />
        <TabButton
          label="Friends"
          isActive={activeTab === 'friends'}
          onClick={() => onTabChange('friends')}
        />
      </div>
    </div>
  );
}
