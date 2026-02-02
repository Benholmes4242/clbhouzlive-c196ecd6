/**
 * Conversation Card Group Component
 * Renders a time-grouped section of conversation cards
 */

import React, { memo } from 'react';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EchoMessageRow } from '@/features/echo/components/EchoMessageRow';
import { LocalTag } from '@/features/echo/components/LocalTag';
import type { EchoMessage as EchoRowMessage } from '@/features/echo/state/echoTypes';
import type { ChatConversation, ExpandedCard } from '../types';

interface ConversationCardGroupProps {
  title: string;
  conversations: ChatConversation[];
  expandedCard: ExpandedCard | null;
  onExpand: (id: string, source?: 'db' | 'legacy') => void;
  onCollapse: () => void;
  onSelectMessage: (content: string) => void;
  onClose: () => void;
}

const ConversationCardGroup: React.FC<ConversationCardGroupProps> = memo(({
  title,
  conversations,
  expandedCard,
  onExpand,
  onCollapse,
  onSelectMessage,
  onClose
}) => {
  if (conversations.length === 0) return null;

  return (
    <div>
      <h3 className="text-body-sm font-medium text-white/80 mb-3">
        {title}
      </h3>
      <div className="space-y-4 sm:space-y-5">
        {conversations.map((conversation) => {
          const isExpanded = expandedCard?.type === 'chat' && expandedCard?.id === conversation.id;
          
          return (
            <article 
              key={conversation.id} 
              className={cn(
                "group relative rounded-2xl bg-white/06 backdrop-blur border border-white/08 hover:border-white/12",
                "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] active:translate-y-0",
                "focus-within:ring-2 focus-within:ring-white/20 px-4 py-3 sm:px-5 sm:py-4 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              )}
              onClick={isExpanded ? undefined : () => onExpand(conversation.id, conversation.source)}
              role="button"
              tabIndex={0}
              aria-label={`Open conversation: ${conversation.customTitle || conversation.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!isExpanded) {
                    onExpand(conversation.id, conversation.source);
                  }
                }
              }}
            >
              {isExpanded ? (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-heading-md font-semibold leading-snug text-white">
                      {conversation.customTitle || conversation.title}
                    </h3>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onCollapse();
                      }}
                      aria-label="Collapse" 
                      className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/08 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 text-white/80"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {conversation.messages.map((message, idx) => {
                      const row: EchoRowMessage = {
                        id: (message as any).id ?? String(idx),
                        role: ((message as any).type === 'user' ? 'user' : 'assistant'),
                        content: (message as any).content ?? '',
                        createdAt: (message as any).timestamp ?? new Date().toISOString(),
                      };
                      return (
                        <EchoMessageRow key={row.id} message={row} />
                      );
                    })}
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const lastUserMessage = conversation.messages.filter(m => m.type === 'user').pop();
                        if (lastUserMessage) {
                          onSelectMessage(lastUserMessage.content);
                          onClose();
                        }
                      }}
                      className="text-sm font-medium text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
                    >
                      Use this response
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 px-2 h-6 inline-flex items-center rounded-md text-meta font-medium bg-white/08 backdrop-blur border border-white/12 text-white/80">
                      Chat
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-body-md font-semibold text-white flex items-center gap-1">
                        <span className="truncate">{conversation.customTitle || conversation.title}</span>
                        {conversation.source === 'legacy' && <LocalTag />}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-meta text-white/60">
                        <span className="truncate">
                          {conversation.messages.find(m => m.type === 'user')?.content || 'No messages yet'}
                        </span>
                        <span className="mx-1 h-1 w-1 rounded-full bg-white/20 shrink-0"></span>
                        <time className="shrink-0 text-white/40">{conversation.timestamp.toLocaleDateString()}</time>
                        <span className="hidden sm:inline text-white/40 shrink-0">• {conversation.messageCount || conversation.messages.length} msgs</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover affordance stripe */}
                  <div className="pointer-events-none absolute inset-x-0 -bottom-px h-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/06 to-transparent"></div>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
});

ConversationCardGroup.displayName = 'ConversationCardGroup';

export default ConversationCardGroup;
