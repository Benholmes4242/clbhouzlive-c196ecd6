/**
 * RequestRow - A single join request with accept/decline actions
 * Supports both game and trip requests
 * Now includes request message preview (Phase 2)
 */

import React, { useState } from 'react';
import { Check, X, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { PendingRequest, PendingGameRequest, PendingTripRequest } from '../../hooks/useHostPendingRequests';

interface RequestRowProps {
  request: PendingRequest;
  onAccept: (request: PendingRequest) => void;
  onDecline: (request: PendingRequest) => void;
  isProcessing: boolean;
}

function isGameRequest(request: PendingRequest): request is PendingGameRequest {
  return request.type === 'game';
}

export function RequestRow({ request, onAccept, onDecline, isProcessing }: RequestRowProps) {
  const { requester } = request;
  const [isMessageExpanded, setIsMessageExpanded] = useState(false);
  
  const handicapDisplay = requester.eg_handicap_index != null 
    ? `HCP ${requester.eg_handicap_index.toFixed(1)}` 
    : null;

  // Get display info based on request type
  let entityName = '';
  let dateDisplay = '';
  let timeDisplay = '';
  let typeLabel = '';

  if (isGameRequest(request)) {
    entityName = request.game.course_name || 'Unknown Course';
    typeLabel = 'Game';
    if (request.game.start_time) {
      dateDisplay = format(new Date(request.game.start_time), 'EEE d MMM');
      timeDisplay = format(new Date(request.game.start_time), 'h:mm a');
    }
  } else {
    entityName = request.trip.name || 'Unknown Trip';
    typeLabel = 'Trip';
    if (request.trip.start_date) {
      dateDisplay = format(new Date(request.trip.start_date), 'EEE d MMM');
    }
  }

  const hasMessage = !!request.request_message;
  const messagePreview = hasMessage 
    ? request.request_message!.slice(0, 60) + (request.request_message!.length > 60 ? '…' : '')
    : null;

  return (
    <div 
      className="rounded-2xl transition-all"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div className="flex items-center gap-3 p-3">
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
            <span 
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ 
                background: request.type === 'game' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                color: request.type === 'game' ? '#16a34a' : '#2563eb',
              }}
            >
              {typeLabel}
            </span>
            <span className="font-medium truncate">{entityName}</span>
            {dateDisplay && <span>• {dateDisplay}</span>}
            {timeDisplay && <span>• {timeDisplay}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onDecline(request)}
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
            onClick={() => onAccept(request)}
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

      {/* Message section */}
      {hasMessage && (
        <div 
          className="px-3 pb-3 pt-0"
        >
          <button
            onClick={() => setIsMessageExpanded(!isMessageExpanded)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all hover:bg-black/[0.02] active:scale-[0.99]"
            style={{
              background: 'rgba(0, 0, 0, 0.02)',
            }}
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#64748b' }} />
            <span 
              className={cn(
                "text-[12px] text-left flex-1",
                isMessageExpanded ? "whitespace-pre-wrap" : "truncate"
              )}
              style={{ color: '#475569' }}
            >
              {isMessageExpanded ? request.request_message : messagePreview}
            </span>
            {request.request_message!.length > 60 && (
              isMessageExpanded 
                ? <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                : <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
