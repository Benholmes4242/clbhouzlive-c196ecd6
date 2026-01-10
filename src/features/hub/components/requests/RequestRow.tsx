/**
 * RequestRow - A single join request with accept/decline actions
 */

import React from 'react';
import { Check, X } from 'lucide-react';
import { format } from 'date-fns';
import type { PendingRequest } from '../../hooks/useHostPendingRequests';

interface RequestRowProps {
  request: PendingRequest;
  onAccept: (requestId: string, gameId: string) => void;
  onDecline: (requestId: string) => void;
  isProcessing: boolean;
}

export function RequestRow({ request, onAccept, onDecline, isProcessing }: RequestRowProps) {
  const { requester, game } = request;
  
  const handicapDisplay = requester.eg_handicap_index != null 
    ? `HCP ${requester.eg_handicap_index.toFixed(1)}` 
    : null;

  const gameDate = game.start_time 
    ? format(new Date(game.start_time), 'EEE d MMM') 
    : '';
  
  const teeTime = game.start_time 
    ? format(new Date(game.start_time), 'h:mm a')
    : '';

  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-2xl transition-all"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {requester.profile_photo_url ? (
          <img
            src={requester.profile_photo_url}
            alt={requester.display_name}
            className="w-11 h-11 rounded-full object-cover"
            style={{ border: '2px solid rgba(255, 255, 255, 0.9)' }}
          />
        ) : (
          <div 
            className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{ 
              background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
              color: '#64748b',
            }}
          >
            {requester.display_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span 
            className="text-[14px] font-semibold truncate"
            style={{ color: '#1e293b' }}
          >
            {requester.display_name}
          </span>
          {handicapDisplay && (
            <span 
              className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ 
                background: 'rgba(0, 0, 0, 0.04)',
                color: '#64748b',
              }}
            >
              {handicapDisplay}
            </span>
          )}
        </div>
        <div 
          className="text-[12px] mt-0.5 truncate"
          style={{ color: '#64748b' }}
        >
          {requester.home_club || 'No home club'}
        </div>
        <div 
          className="text-[11px] mt-1 flex items-center gap-1.5"
          style={{ color: '#94a3b8' }}
        >
          <span className="font-medium">{game.course_name}</span>
          {gameDate && <span>• {gameDate}</span>}
          {teeTime && <span>• {teeTime}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onDecline(request.id)}
          disabled={isProcessing}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
          }}
          aria-label="Decline request"
        >
          <X className="w-4 h-4" style={{ color: '#ef4444' }} />
        </button>
        <button
          onClick={() => onAccept(request.id, request.game_id)}
          disabled={isProcessing}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(22, 163, 74, 0.08) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
          }}
          aria-label="Accept request"
        >
          <Check className="w-4 h-4" style={{ color: '#16a34a' }} />
        </button>
      </div>
    </div>
  );
}
