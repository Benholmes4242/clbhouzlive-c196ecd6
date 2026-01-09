import React from 'react';
import { MessageSquare } from 'lucide-react';

export type HubMessagesSummary = {
  unreadCount: number;
  latestSnippet?: string;
};

export interface MessagesCardProps {
  summary: HubMessagesSummary;
  onPress: () => void;
  onSeeAll: () => void;
}

/**
 * MessagesCard
 * - If unreadCount === 0: show empty-state copy (not a dummy tooltip).
 * - If unreadCount > 0: show snippet + badge count.
 */
export function MessagesCard({ summary, onPress, onSeeAll }: MessagesCardProps) {
  const hasUnread = (summary.unreadCount ?? 0) > 0;

  return (
    <div className="hubCard hubCard--messages">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-black/85">Messages</div>
        <button type="button" className="text-sm text-black/50 hover:text-black/70" onClick={onSeeAll}>
          See all →
        </button>
      </div>

      <button type="button" className="messagesBody" onClick={onPress}>
        <div className="messagesIcon">
          <MessageSquare className="h-5 w-5 text-black/60" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-black/75">Messages</div>
          <div className="text-sm text-black/45 mt-1">
            {hasUnread
              ? (summary.latestSnippet ?? 'You have new messages')
              : 'Game chats, invites, and messages with golfers — all in one place.'}
          </div>
        </div>

        {hasUnread && (
          <div className="messagesBadge" aria-label={`${summary.unreadCount} unread`}>
            {summary.unreadCount}
          </div>
        )}
      </button>
    </div>
  );
}
