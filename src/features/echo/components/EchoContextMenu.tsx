/**
 * Echo Context Menu
 * Long-press/right-click menu for message actions
 */

import React from 'react';
import type { EchoMessage } from '../state/echoTypes';

interface EchoContextMenuProps {
  message: EchoMessage;
  position: { x: number; y: number };
  onClose: () => void;
  onCopy: () => void;
  onReply: () => void;
  onShare: () => void;
}

export function EchoContextMenu({ 
  message, 
  position, 
  onClose, 
  onCopy, 
  onReply, 
  onShare 
}: EchoContextMenuProps) {
  const actions = [
    { id: "reply", label: "Reply ↘", onClick: onReply },
    { id: "copy", label: "Copy", onClick: onCopy },
    { id: "share", label: "Share…", onClick: onShare },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/30"
      onClick={onClose}
    >
      <div
        className="absolute z-[61] min-w-[180px] rounded-2xl bg-black/80 
                   border border-white/10 backdrop-blur-2xl text-body-md
                   shadow-[0_24px_60px_rgba(0,0,0,0.85)] overflow-hidden"
        style={{
          top: Math.min(position.y, window.innerHeight - 180),
          left: Math.min(position.x - 100, window.innerWidth - 220),
        }}
        onClick={e => e.stopPropagation()}
      >
        {actions.map(action => (
          <button
            key={action.id}
            className="w-full text-left px-4 py-2.5 text-white/90 hover:bg-white/10 transition-colors"
            onClick={() => {
              action.onClick();
              onClose();
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
