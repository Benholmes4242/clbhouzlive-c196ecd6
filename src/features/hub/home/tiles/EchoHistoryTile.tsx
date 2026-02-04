/**
 * Echo History Tile
 * Full-width tile showing recent Echo chat and swing analyses with thumbnails
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { formatRelativeTime } from '@/utils/dateFormat';
import { useEchoConversations } from '@/features/echo/hooks/useEchoHistory';
import { useSwingHistory } from '@/features/echo/hooks/useSwingHistory';

interface EchoHistoryTileProps {
  limitChat?: number;
  limitSwing?: number;
}

export function EchoHistoryTile({ 
  limitChat = 10, 
  limitSwing = 8
}: EchoHistoryTileProps) {
  const nav = useNavigate();
  
  const comingSoon = () => {
    alert('Coming soon');
  };
  
  // Use the consolidated echo_conversations table
  const { data: conversations = [], isLoading: chatLoading, error: chatErr } = useEchoConversations();
  const chatItems = conversations.slice(0, limitChat);
  const { data: swingItems = [], isLoading: swingLoading, error: swingErr } = useSwingHistory({ limit: limitSwing });

  // Surface errors for debugging (won't break the other section)
  if (chatErr) console.warn('[EchoHistoryTile] chat history error:', chatErr);
  if (swingErr) console.warn('[EchoHistoryTile] swing history error:', swingErr);

  return (
    <Tile 
      title="Chat and Swing History"
      footer={
        <div className="mt-auto pt-4">
          <button
            onClick={comingSoon}
            className="ml-auto mt-3 sm:mt-4 block text-[15px] font-medium transition"
            style={{ 
              background: 'transparent',
              border: 'none',
              color: 'var(--hub-text-body)',
              padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
            aria-label="View all chat and swing history"
          >
            View all →
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* CHAT SECTION */}
        <section>
          <div className="text-[15px] font-medium mb-2 opacity-80">Chat</div>

          <div className="relative">
            {/* Scroll container */}
            <div className="cs-scroll max-h-[140px] overflow-y-auto pr-1 -mr-1">
              {chatLoading && (
                <>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="h-[68px] rounded-sq-md mb-2 animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
                  ))}
                </>
              )}
              {!chatLoading && chatItems.length === 0 && (
                <div className="text-[13px] opacity-60 py-10 text-center">
                  No Echo chats yet — ask Echo anything above.
                </div>
              )}
              {!chatLoading && chatItems.map(item => (
                <button
                  key={item.id}
                  onClick={comingSoon}
                  className="w-full text-left rounded-sq-md bg-white/5 hover:bg-white/7 transition px-3 py-2.5 mb-2 flex items-start gap-2 border border-white/6"
                >
                  <span className="inline-flex h-[22px] w-[22px] rounded-full items-center justify-center bg-white/10 mr-1">
                    🗨️
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-[14px] leading-tight">
                      {item.title || 'Untitled conversation'}
                    </div>
                    <div className="text-[12px] opacity-60 mt-0.5">
                      {formatRelativeTime(item.last_message_at || item.created_at)}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Fade mask */}
            {!chatLoading && chatItems.length > 0 && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[rgba(0,0,0,0.35)] to-transparent" />
            )}
          </div>
        </section>

        {/* SWING SECTION */}
        <section>
          <div className="text-[15px] font-medium mb-2 opacity-80">Swing</div>

          <div className="relative">
            <div className="cs-scroll max-h-[160px] overflow-y-auto pr-1 -mr-1">
              {swingLoading && (
                <>
                  {[0, 1].map(i => (
                    <div key={i} className="h-[140px] rounded-sq-md mb-3 animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
                  ))}
                </>
              )}
              {!swingLoading && swingItems.length === 0 && (
                <div className="text-[13px] opacity-60 py-10 text-center">
                  No swing videos yet — upload one to get feedback.
                </div>
              )}
              {!swingLoading && swingItems.map(item => (
                <button
                  key={item.id}
                  onClick={comingSoon}
                  className="w-full mb-3 rounded-sq-md overflow-hidden relative border border-white/6 bg-white/5 hover:bg-white/7 transition"
                >
                  {/* Title above thumb */}
                  <div className="px-3 pt-3 pb-2 text-[14px] leading-tight">
                    {item.title || 'Swing Analysis'}
                  </div>

                  {/* Thumbnail with overlay */}
                  <div className="relative px-3 pb-3">
                    <div className="rounded-sq-md overflow-hidden relative h-[92px]">
                      {item.thumbnail_url ? (
                        <video
                          src={item.thumbnail_url}
                          className="absolute inset-0 h-full w-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <div className="absolute inset-0 h-full w-full bg-white/10" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-black/0" />
                      <div className="absolute left-2 bottom-2 text-[12px] opacity-85">
                        {formatRelativeTime(item.created_at)}
                      </div>
                      <span className="absolute right-2 bottom-2 text-[13px] px-3 py-1 rounded-full bg-white/12 border border-white/15">
                        View
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Fade mask */}
            {!swingLoading && swingItems.length > 0 && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[rgba(0,0,0,0.35)] to-transparent" />
            )}
          </div>
        </section>
      </div>
    </Tile>
  );
}
