/**
 * HubQuickActionsV3 - Premium unified rail with 3 segments
 * Messages, Echo (accent highlighted), Create
 * Single container with glass effect, equal-width segments
 */

import React, { useState } from 'react';
import { MessageSquare, Sparkles, Plus } from 'lucide-react';
import { HubMessagesSheet } from '@/features/hub/components/HubMessagesSheet';
import { HubEchoSheet } from '@/features/hub/components/HubEchoSheet';
import { CreateGameTripSheetV2 } from '@/features/hub/components/create-game-trip-v2';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface SegmentProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isAccent?: boolean;
  badge?: number;
}

function Segment({ icon, label, onClick, isAccent, badge }: SegmentProps) {
  return (
    <button
      onClick={() => {
        haptic('light');
        onClick();
      }}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-3 transition-all duration-150 active:scale-[0.97] relative rounded-full",
        isAccent && "mx-0.5"
      )}
      style={isAccent ? {
        background: 'rgba(255, 142, 61, 0.12)',
      } : undefined}
    >
      <span 
        className="transition-colors"
        style={{ color: isAccent ? '#FF8E3D' : 'var(--hub-text-dim)' }}
      >
        {icon}
      </span>
      <span 
        className="text-[13px] font-semibold"
        style={{ color: isAccent ? '#FF8E3D' : 'var(--hub-text)' }}
      >
        {label}
      </span>
      
      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <span 
          className="absolute -top-1 right-1/4 h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
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
      {/* Single unified rail container - premium glass effect */}
      <div 
        className="flex items-center rounded-full"
        style={{
          height: '56px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: '0 10px 28px rgba(2, 6, 23, 0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}
      >
        <Segment
          icon={<MessageSquare className="h-[18px] w-[18px]" />}
          label="Messages"
          onClick={() => setMessagesOpen(true)}
          badge={unreadCount}
        />
        
        {/* Echo segment with accent highlight */}
        <Segment
          icon={<Sparkles className="h-[18px] w-[18px]" />}
          label="Echo"
          onClick={() => setEchoOpen(true)}
          isAccent
        />
        
        <Segment
          icon={<Plus className="h-[18px] w-[18px]" />}
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
