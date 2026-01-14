/**
 * HubQuickActionsV3 - Pill bar with 3 quick actions
 * Messages, Echo, Create (Moment)
 * Glass/frosted feel, centered row
 */

import React, { useState } from 'react';
import { MessageSquare, Sparkles, Plus } from 'lucide-react';
import { HubMessagesSheet } from '@/features/hub/components/HubMessagesSheet';
import { HubEchoSheet } from '@/features/hub/components/HubEchoSheet';
import { CreateGameTripSheetV2 } from '@/features/hub/components/create-game-trip-v2';
import { haptic } from '@/utils/haptics';

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
}

function QuickActionButton({ icon, label, onClick, badge }: QuickActionButtonProps) {
  return (
    <button
      onClick={() => {
        haptic('light');
        onClick();
      }}
      className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-150 active:scale-[0.97] relative"
      style={{
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(15, 23, 42, 0.06)',
        boxShadow: '0 4px 12px rgba(2, 6, 23, 0.05)',
      }}
    >
      <span style={{ color: 'var(--hub-text-dim)' }}>{icon}</span>
      <span 
        className="text-[13px] font-semibold"
        style={{ color: 'var(--hub-text)' }}
      >
        {label}
      </span>
      
      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <span 
          className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
          style={{
            background: 'rgba(255, 142, 61, 0.95)',
            color: '#fff',
          }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

export function HubQuickActionsV3() {
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [echoOpen, setEchoOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // TODO: Get real unread count
  const unreadCount = 0;

  return (
    <>
      <div className="flex items-center justify-center gap-2 py-3">
        <QuickActionButton
          icon={<MessageSquare className="h-4 w-4" />}
          label="Messages"
          onClick={() => setMessagesOpen(true)}
          badge={unreadCount}
        />
        <QuickActionButton
          icon={<Sparkles className="h-4 w-4" />}
          label="Echo"
          onClick={() => setEchoOpen(true)}
        />
        <QuickActionButton
          icon={<Plus className="h-4 w-4" />}
          label="Create"
          onClick={() => setCreateOpen(true)}
        />
      </div>

      <HubMessagesSheet isOpen={messagesOpen} onClose={() => setMessagesOpen(false)} />
      <HubEchoSheet isOpen={echoOpen} onClose={() => setEchoOpen(false)} />
      <CreateGameTripSheetV2 isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
