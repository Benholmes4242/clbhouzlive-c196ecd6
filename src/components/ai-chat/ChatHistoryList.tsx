/**
 * Chat History List
 * Displays chat conversation history
 */

import React from 'react';
import { useEchoConversationsContext } from '@/features/echo/components/EchoConversationsProvider';
import { formatDistanceToNow } from 'date-fns';

interface ChatHistoryListProps {
  onSelect: (id: string) => void;
}

export function ChatHistoryList({ onSelect }: ChatHistoryListProps) {
  const { conversations } = useEchoConversationsContext();

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 text-white/60">
        <p>No conversations yet</p>
        <p className="text-sm mt-2 text-white/40">Start a chat to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((convo) => (
        <button
          key={convo.id}
          onClick={() => onSelect(convo.id)}
          className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <div className="font-medium text-white mb-1">{convo.title}</div>
          <div className="text-sm text-white/60">
            {convo.messages.length} messages • {' '}
            {formatDistanceToNow(new Date(convo.updatedAt), { addSuffix: true })}
          </div>
        </button>
      ))}
    </div>
  );
}
